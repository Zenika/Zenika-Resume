"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const moment = require("moment");
const fetch = require("node-fetch");
const helmet = require("helmet");
const redirectSsl = require("redirect-ssl");

const app = express();
const api = express.Router();

const jwt = require("express-jwt");
const jwks = require("jwks-rsa");

const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://zenika.eu.auth0.com/.well-known/jwks.json"
  }),
  audience: "https://resume.zenika.com",
  issuer: "https://zenika.eu.auth0.com/",
  algorithms: ["RS256"]
});

// config
const staticPath = path.join(__dirname, "../build");

const hasuraGraphQlUrl = process.env.HASURA_GRAPHQL_URL;

const basicAuth = require("basic-auth");

const authApi = function(req, res, next) {
  const user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    res.set("WWW-Authenticate", "Basic realm=Authorization Required");
    res.sendStatus(401);
  } else if (
    user.name === process.env.USER_AUTH_API_USERNAME &&
    user.pass === process.env.USER_AUTH_API_PASSWORD
  ) {
    next();
  } else {
    res.set("WWW-Authenticate", "Basic realm=Authorization Required");
    res.sendStatus(401);
  }
};

app.set("port", process.env.PORT || 3000);
app.set("etag", false);

// middlewares
app.use(redirectSsl);
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, OPTIONS");
  next();
});

app.use(api);

app.use(express.static(staticPath));

const fetchDms = async (query, params, authorizationHeader) => {
  const response = await fetch(hasuraGraphQlUrl, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: params })
  });
  if (!response.ok) {
    throw new Error(
      `${response.status} -> ${response.statusText} : ${JSON.stringify(
        await response.json()
      )}`
    );
  }
  return await response.json();
};

const executeQueryWithCallback = async (query, params, req, res, callback) => {
  try {
    const authorizationHeader = req.headers.authorization;
    const response = await fetchDms(query, params, authorizationHeader);
    if (response.errors) throw new Error(JSON.stringify(response.errors));
    callback({ rows: response.data.resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ Error: err });
  }
};

function buildDocumentFromQueryResult(data) {
  data = data.rows[0];
  data.metadata = JSON.parse(data.metadata);
  data.last_modified = moment(data.last_modified)
    .toDate()
    .getTime();
  return data;
}

function findByUuidForVersionDate(req, res, uuid, versionDate) {
  executeQueryWithCallback(
    `query resume($uuid: uuid, $version_date: date) {
      resume(
        where: {
          uuid: { _eq: $uuid }
          version_date: { _lte: $version_date }
        }
        order_by: { version_date: desc }
        limit: 1
      ) {
        content
        metadata
        uuid
        version
        last_modified
      }
    }
    `,
    { 
      uuid, 
      version_date: versionDate 
    },
    req,
    res,
    function(data) {
      if (data.rows.length < 1) {
        res.status(404).json();
      } else {
        res.status(200).json(buildDocumentFromQueryResult(data));
      }
    }
  );
}

function findByUuid(req, res, uuid) {
  executeQueryWithCallback(
    `query resume($uuid: uuid_comparison_exp) {
      resume: latest_resume(where: {uuid: $uuid}) {
        uuid
        content
        metadata
        path
        version
        last_modified
      }
    }`,
    { uuid: { _eq: uuid } },
    req,
    res,
    function(data) {
      if (data.rows.length != 1) {
        res.status(404).json();
      } else {
        res.status(200).json(buildDocumentFromQueryResult(data));
      }
    }
  );
}

// API
api.get("/documents/:uuid", jwtCheck, (req, res) => {
  const uuid = req.params.uuid;
  const { version_date :versionDate } = req.query;
  if (!versionDate) {
    findByUuid(req, res, uuid);
  } else {
    findByUuidForVersionDate(req, res, uuid, versionDate);
  }
});

api.put("/documents/:uuid", jwtCheck, bodyParser.json(), async (req, res) => {
  const uuid = req.params.uuid;

  // request validation
  if (!req.body.content) {
    res.status(400).json();
    return;
  }

  let document = {};
  document.uuid = uuid;
  document.content = req.body.content;
  document.metadata = JSON.stringify(req.body.metadata);
  document.last_modified = moment().format("YYYY-MM-DD HH:mm:ss");

  executeQueryWithCallback(
    `
      mutation upsertResume($resume: resume_insert_input!) {
        insert_resume(objects: [$resume] on_conflict: {constraint: resume_pkey, update_columns: [content, path, version, last_modified, metadata]}) {
          affected_rows
        }
      }
    `,
    {
      resume: {
        content: document.content,
        metadata: document.metadata,
        uuid,
        path: null,
        version: 1,
        last_modified: document.last_modified
      }
    },
    req,
    res,
    function(result) {
      document.last_modified = moment(document.last_modified)
        .toDate()
        .getTime();
      res.status(200).json(document);
    }
  );
});

api.get("/resumes/mine", jwtCheck, async (req, res) => {
  try {
    const response = await fetch("https://zenika.eu.auth0.com/userinfo", {
      headers: {
        Authorization: req.get("Authorization"),
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw response;
    }
    const { email } = await response.json();
    executeQueryWithCallback(
      `query ($email: String_comparison_exp) {
        resume: latest_resume(where: {metadata: $email}) {
          last_modified: last_modified
          metadata
          path
          uuid
          version
        }
      }`,
      { email: { _like: `%${email}%` } },
      req,
      res,
      function(data) {
        res.status(200).json(
          data.rows.map(row => {
            row.metadata = JSON.parse(row.metadata);
            return row;
          })
        );
      }
    );
  } catch (err) {
    console.error(err);
    res.sendStatus(502);
  }
});

// API
api.get("/resumes", jwtCheck, (req, res) => {
  executeQueryWithCallback(
    `
    {
      resume: latest_resume(order_by: {last_modified: desc}) {
        uuid
        metadata
        path
        version
        last_modified
      }
    }`,
    undefined,
    req,
    res,
    function(data) {
      res.status(200).json(
        data.rows.map(row => {
          row.metadata = JSON.parse(row.metadata);
          return row;
        })
      );
    }
  );
});

api.get("/resumes/complete", authApi, (req, res) => {
  executeQueryWithCallback(
    `{
      resume: latest_resume {
        last_modified: last_modified
        metadata
        path
        uuid
        version
      }
    }`,
    undefined,
    req,
    res,
    data => {
      const promises = data.rows.map(row => {
        row.metadata = JSON.parse(row.metadata);
        return row;
      });

      Promise.all(promises).then(results => {
        return res.status(200).json(results);
      });
    }
  );
});

// Listen only when doing: `node app/server.js`
if (require.main === module) {
  app.listen(app.get("port"), () => {
    console.log(`Running at localhost:${app.get("port")}`);
  });
}

module.exports = app;
