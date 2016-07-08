const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const app = express();
const api = express.Router();

const pg = require('pg');

const buildPath = require('./build-path');

// config
const staticPath = path.join(__dirname, '/build');
const dataDir = process.env.MONOD_DATA_DIR || path.join(__dirname, '/data');

var databaseUrl = process.env.DATABASE_URL || 'postgres://localhost/resume';

app.set('port', process.env.PORT || 3000);
app.set('etag', false);

// middlewares
app.use(compression());
app.use(express.static(staticPath));
app.use(bodyParser.json());
app.use(api);

function executeQueryWithCallback(query, params, response, callback) {
  pg.connect(databaseUrl, function (err, client, done) {
    try {
      if (!client) {
        return;
      }
      client.query(query, params, function (err, result) {
        done();
        if (err) {
          console.error(err);
          response.send("Error " + err);
        }
        else {
          callback(result);
        }
      });
    } catch (error) {
      try {
        done();
      } catch (error) {
        // nothing to do just keep the program running
      }
    }
  });
}

const isValidId = (uuid) => {
  return /[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/.test(uuid);
};

// Match UUIDs
app.get('/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}', (req, res) => {
  res.sendFile('index.html', {
    root: staticPath
  });
});

app.use('/', express.static('.'));

function buildDocumentFromQueryResult(data) {
  data = data.rows[0];
  data.metadata = JSON.parse(data.metadata);
  data.last_modified = moment(data.last_modified).toDate().getTime();
  return data;
}

// API
api.get('/documents/:uuid', (req, res) => {
  const uuid = req.params.uuid;

  executeQueryWithCallback(
    'SELECT id, uuid, content, metadata, path, version, last_modified FROM resume where uuid=($1)',
    [uuid],
    res,
    function (data) {
      if (data.rows.length != 1) {
        executeQueryWithCallback(
          'SELECT id, content, metadata, path, version, last_modified FROM resume where path=($1)',
          [uuid],
          res,
          function (data) {
            if (data.rows.length < 1) {
              res.status(404);
              return;
            }
            data.uuid = '';
            res.status(200).json(buildDocumentFromQueryResult(data));
          });
      } else {
        res.status(200).json(buildDocumentFromQueryResult(data));
      }
    });
});

api.put('/documents/:uuid', (req, res) => {
  const uuid = req.params.uuid;

  // request validation
  if (!isValidId(uuid) || !req.body.content) {
    return res.status(400).json();
  }

  executeQueryWithCallback(
    'SELECT id, content, uuid, path, version, last_modified FROM resume where uuid=($1)',
    [uuid],
    res,
    function (data) {
      var document = {};
      document.uuid = uuid;
      document.content = req.body.content;
      document.metadata = JSON.stringify(req.body.metadata);
      document.last_modified = moment().format('YYYY-MM-DD HH:mm:ss');
      console.log(data + " select from update");
      var sql = '';
      if (data.rows.length == 0) {
        sql = 'INSERT into resume (content, uuid, path, version, last_modified, metadata) VALUES($1, $2, $3, $4, $5, $6) RETURNING id';
      } else {
        sql = 'UPDATE resume SET content = $1, path = $3, version = $4, last_modified = $5, metadata = $6 where uuid = $2';
      }

      var path = buildPath(req.body.metadata.name + '');

      executeQueryWithCallback(
        sql,
        [
          document.content,
          document.uuid,
          path,
          1,
          document.last_modified,
          document.metadata,
        ],
        res,
        function (result) {
          console.log("update done");
          document.last_modified = moment(document.last_modified).toDate().getTime();
          res.status(200).json(document);
        }
      );
    });
});

// Listen only when doing: `node app/server.js`
if (require.main === module) {
  app.listen(app.get('port'), () => {
    console.log(`Running at localhost: ${app.get('port')}`);
  });
}

module.exports = app;
