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
const googleConf = require('./conf-google');

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// config
const staticPath = path.join(__dirname, '/build');

var databaseUrl = process.env.DATABASE_URL || 'postgres://localhost/resume';
var googleId = process.env.GOOGLE_ID || googleConf.id;
var googleSecret = process.env.GOOGLE_SECRET || googleConf.secret;
var googleCallback = process.env.GOOGLE_CALLBACK || googleConf.callback;

var isDev = !process.env.DATABASE_URL;

app.set('port', process.env.PORT || 3000);
app.set('etag', false);

// middlewares
app.use(compression());
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(api);

function isUserConnectedAndZenika(req) {
  if (req.session.isZenika) {
    return true;
  }
  if (req.user &&
    req.user.emails
      .map((email)=> email.value)
      .join('')
      .indexOf('@zenika') != -1
  ) {
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
    res.redirect('/');
  });
});

app.use((req, res, next)=> {
  if (req.originalUrl == '/') {
    if (isUserConnectedAndZenika(req)) {
      return next();
    }
    if (isUserConnected(req)) {
      res.redirect('/not-zenika.html');
      return;
    }
    res.redirect('/login/google');
    return;
  }
  return next();
}, express.static(staticPath));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

function ensureAuthenticated(req, res, next) {
  if (isUserConnectedAndZenika(req)) {
    return next();
  }
  res.redirect('/login/google?uuid=' + req.originalUrl.split('/')[1]);
}

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

passport.use(new GoogleStrategy({
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
));

app.get('/login/google', (req, res, next)=> {
  req.session.requestedUuid = req.query.uuid;
  return next();
}, passport.authenticate('google', {scope: ['profile', 'email']}));

app.get('/login/google/callback',
  passport.authenticate('google', {failureRedirect: '/login'}),
  function (req, res) {
    if (req.session.requestedUuid) {
      res.redirect('/' + req.session.requestedUuid);
    } else {
      res.redirect('/');
    }
  });

// Match UUIDs
app.get('/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}', ensureAuthenticated, (req, res) => {
  res.sendFile('index.html', {
    root: staticPath
  });
});

app.get('/[a-z-]+', (req, res, next)=> {
  return next();
}, (req, res) => {
  res.sendFile('index.html', {
    root: staticPath
  });
});

function buildDocumentFromQueryResult(data) {
  data = data.rows[0];
  data.metadata = JSON.parse(data.metadata);
  data.last_modified = moment(data.last_modified).toDate().getTime();
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
    });
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
      });
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
    return res.redirect('/login/google?uuid' + uuid);
  }

  // request validation
  if (!req.body.content) {
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
          document.last_modified = moment(document.last_modified).toDate().getTime();
          res.status(200).json(document);
        }
      );
    });
});

// API
api.get('/resumes', (req, res) => {
  if (!isUserConnectedAndZenika(req)) {
    res.status(401).json();
  }

  executeQueryWithCallback(
    'SELECT uuid, metadata, path, version, last_modified FROM resume ORDER BY path ASC, last_modified DESC',
    [],
    res,
    function (data) {
      res.status(200).json(data.rows.map((row)=>{
        row.metadata = JSON.parse(row.metadata);
        return row;
      }));
    });
});

// Listen only when doing: `node app/server.js`
if (require.main === module) {
  app.listen(app.get('port'), () => {
    console.log(`Running at localhost: ${app.get('port')}`);
  });
}

module.exports = app;
