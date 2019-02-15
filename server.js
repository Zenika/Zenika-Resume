const DecryptUtils = require('./app/DecryptUtils');

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

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// config
const staticPath = path.join(__dirname, '/build');

const databaseUrl = process.env.DATABASE_URL || 'postgres://localhost/resume';
const googleId = process.env.GOOGLE_ID || require('./conf-google').id;
const googleSecret = process.env.GOOGLE_SECRET || require('./conf-google').secret;
const googleCallback = process.env.GOOGLE_CALLBACK || require('./conf-google').callback;

const isDev = !process.env.DATABASE_URL;

const basicAuth = require('basic-auth');

const authApi = function (req, res, next) {
  const user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    res.sendStatus(401);
  } else if (
    user.name === process.env.USER_AUTH_API_USERNAME &&
    user.pass === process.env.USER_AUTH_API_PASSWORD
  ) {
    next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    res.sendStatus(401);
  }
};

app.set('port', process.env.PORT || 3000);
app.set('etag', false);

// middlewares
app.use(compression());
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, OPTIONS');
  next();
});

app.use(api);

function validEmail(email) {
  if (email.indexOf('-ext@') >= 0) {
    return false;
  } else if (email.indexOf('@zenika.com') >= 0) {
    return true;
  } else if (email.indexOf('zenika.resume@gmail.com') >= 0) {
    return true;
  }
  return false;
}

function hasValidEmail(req) {
  const emails = req.user.emails.map(email => email.value);
  return emails.some(validEmail);
}

function isUserConnectedAndZenika(req) {
  if (req.session.isZenika) {
    return true;
  }
  if (req.user && hasValidEmail(req)) {
    req.session.isZenika = true;
    return true;
  }
  return false;
}

function isUserConnected(req) {
  if (req.user) {
    return true;
  }
  return false;
}

app.get('/logout', function (req, res) {
  req.logOut();
  req.session.destroy(function (err) {
    res.redirect('/#/bye');
  });
});

app.use((req, res, next) => {
  if (req.originalUrl == '/') {
    if (isUserConnectedAndZenika(req)) {
      next();
    } else if (isUserConnected(req)) {
      res.redirect('/not-zenika.html');
    } else {
      next();
    }
  } else {
    next();
  }
}, express.static(staticPath));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

function ensureAuthenticated(req, res, next) {
  if (isUserConnectedAndZenika(req)) {
    next();
  } else {
    res.redirect('/login/google?uuid=' + req.originalUrl.split('/')[1]);
  }
}

function executeQueryWithCallback(query, params, response, callback) {
  pg.connect(
    databaseUrl,
    function (err, client, done) {
      try {
        if (err) {
          console.error(err);
          response.sendStatus(500);
        }
        if (!client) {
          console.error("no pg client available");
          response.sendStatus(500);
          return;
        }
        client.query(query, params, function (err, result) {
          done();
          if (err) {
            console.error(err);
            response.send('Error ' + err);
          } else {
            callback(result);
          }
        });
      } catch (error) {
        try {
          done();
        } catch (error) {
          // nothing to do just keep the program running
        }
        console.error(error);
        response.sendStatus(500);
      }
    }
  );
}

const isValidId = uuid => {
  return /[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/.test(uuid);
};

passport.use(
  new GoogleStrategy(
    {
      clientID: googleId,
      clientSecret: googleSecret,
      callbackURL: googleCallback
    },
    function (token, tokenSecret, profile, done) {
      process.nextTick(function () {
        profile.identifier = token;
        return done(null, profile);
      });
    }
  )
);

app.get('/me', function (req, res) {
  if (!isUserConnectedAndZenika(req)) {
    res.redirect('/login/google');
    return;
  }
  res.status(200).json(req.user);
});

app.get(
  '/login/google',
  (req, res, next) => {
    req.session.requestedUuid = req.query.uuid;
    return next();
  },
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  })
);

app.get(
  '/login/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    if (req.session.requestedUuid) {
      res.redirect('/' + req.session.requestedUuid);
    } else {
      res.redirect('/');
    }
  }
);

// Match UUIDs
app.get('/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}', ensureAuthenticated, (req, res) => {
  res.sendFile('index.html', {
    root: staticPath
  });
});

app.get(
  '/[a-z-]+',
  (req, res, next) => {
    return next();
  },
  (req, res) => {
    res.sendFile('index.html', {
      root: staticPath
    });
  }
);

function buildDocumentFromQueryResult(data) {
  data = data.rows[0];
  data.metadata = JSON.parse(data.metadata);
  data.last_modified = moment(data.last_modified)
    .toDate()
    .getTime();
  return data;
}

function findByPath(req, res, path) {
  executeQueryWithCallback(
    'SELECT id, content, metadata, path, version, last_modified FROM resume where path=($1) ORDER BY last_modified DESC',
    [path],
    res,
    function (data) {
      if (data.rows.length < 1) {
        findByUuid(req, res, path);
      } else {
        data.uuid = '';
        res.status(200).json(buildDocumentFromQueryResult(data));
      }
    }
  );
}

function findByUuid(req, res, uuid) {
  if (!isUserConnectedAndZenika(req)) {
    res.status(401).json();
  } else {
    executeQueryWithCallback(
      'SELECT id, uuid, content, metadata, path, version, last_modified FROM resume where uuid=($1)',
      [uuid],
      res,
      function (data) {
        if (data.rows.length != 1) {
          res.status(404).json();
        } else {
          res.status(200).json(buildDocumentFromQueryResult(data));
        }
      }
    );
  }
}

// API
api.get('/documents/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  findByPath(req, res, uuid);
});

api.put('/documents/:uuid', bodyParser.json(), (req, res) => {
  const uuid = req.params.uuid;

  if (!isUserConnectedAndZenika(req)) {
    res.redirect('/login/google?uuid=' + uuid);
    return;
  }

  // request validation
  if (!req.body.content) {
    res.status(400).json();
    return;
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

      var sql = '';
      if (data.rows.length == 0) {
        sql =
          'INSERT into resume (content, uuid, path, version, last_modified, metadata) VALUES($1, $2, $3, $4, $5, $6) RETURNING id';
      } else {
        sql =
          'UPDATE resume SET content = $1, path = $3, version = $4, last_modified = $5, metadata = $6 where uuid = $2';
      }

      const path = req.body.metadata.firstname
        ? buildPath(
            `${req.body.metadata.firstname} ${req.body.metadata.name} ${req.body.metadata.agency} ${
              req.body.metadata.lang
            }`
          )
        : buildPath(req.body.metadata.name + '');

      executeQueryWithCallback(
        sql,
        [document.content, document.uuid, path, 1, document.last_modified, document.metadata],
        res,
        function (result) {
          document.last_modified = moment(document.last_modified)
            .toDate()
            .getTime();
          res.status(200).json(document);
        }
      );
    }
  );
});

// API
api.get('/resumes', (req, res) => {
  if (!isUserConnectedAndZenika(req)) {
    res.status(401).json();
    return;
  }

  executeQueryWithCallback(
    'SELECT uuid, metadata, path, version, last_modified FROM resume ORDER BY last_modified DESC',
    [],
    res,
    function (data) {
      res.status(200).json(
        data.rows.map(row => {
          row.metadata = JSON.parse(row.metadata);
          return row;
        })
      );
    }
  );
});

api.get('/resumes/mine', (req, res) => {
  if (!isUserConnectedAndZenika(req) || !req.user.emails[0].value) {
    res.status(401).json();
    return;
  }

  executeQueryWithCallback(
    'SELECT uuid, metadata, path, version, last_modified FROM resume WHERE metadata LIKE $1 ORDER BY last_modified DESC',
    [`%${req.user.emails[0].value}%`],
    res,
    function (data) {
      res.status(200).json(
        data.rows.map(row => {
          row.metadata = JSON.parse(row.metadata);
          return row;
        })
      );
    }
  );
});

api.get('/resumes/complete', authApi, (req, res) => {
  executeQueryWithCallback(
    'SELECT r1.uuid, r1.content, r1.metadata, r1.path, r1.version, r1.last_modified FROM resume r1\n' +
      'INNER JOIN \n' +
      '(\n' +
      '   SELECT path, MAX(last_modified) AS MAXDATE\n' +
      '   FROM resume\n' +
      '   GROUP BY path\n' +
      ') t2\n' +
      'ON r1.path = t2.path\n' +
      'AND r1.last_modified = t2.MAXDATE',
    [],
    res,
    data => {
      const promises = data.rows.map(row => {
        row.metadata = JSON.parse(row.metadata);
        return DecryptUtils.decrypt(row.content, '').then(ctDecrypted => {
          row.content = ctDecrypted;
          return row;
        });
      });

      Promise.all(promises).then(results => {
        return res.status(200).json(results);
      });
    }
  );
});

// Listen only when doing: `node app/server.js`
if (require.main === module) {
  app.listen(app.get('port'), () => {
    console.log(`Running at localhost: ${app.get('port')}`);
  });
}

module.exports = app;
module.exports.hasValidEmail = hasValidEmail;
