const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const api = express.Router();

// config
const staticPath = path.join(__dirname, '/build');
const dataDir = process.env.MONOD_DATA_DIR || path.join(__dirname, '/data');

app.set('port', process.env.PORT || 3000);
app.set('etag', false);

// middlewares
app.use(compression());
app.use(express.static(staticPath));
app.use(bodyParser.json());
app.use(api);

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

// API
api.get('/documents/:uuid', (req, res) => {
  const uuid = req.params.uuid;

  // request validation
  if (!isValidId(uuid)) {
    return res.status(400).json();
  }

  return fs.readFile(path.join(dataDir, uuid), (err, data) => {
    if (err) {
      return res.status(404).json();
    }

    return res.json(JSON.parse(data));
  });
});

api.put('/documents/:uuid', (req, res) => {
  const uuid = req.params.uuid;

  // request validation
  if (!isValidId(uuid) || !req.body.content) {
    return res.status(400).json();
  }

  const filename = path.join(dataDir, uuid);

  return fs.readFile(filename, (readErr, data) => {
    const document = readErr ? {} : JSON.parse(data);

    document.uuid = uuid;
    document.content = req.body.content;
    document.last_modified = Date.now();

    fs.writeFile(filename, JSON.stringify(document), (err) => {
      if (err) {
        return res.status(500).json();
      }

      return res.status(readErr ? 201 : 200).json(document);
    });
  });
});

// Listen only when doing: `node app/server.js`
if (require.main === module) {
  app.listen(app.get('port'), () => {
    console.log(`Running at localhost: ${app.get('port')}`);
  });
}

module.exports = app;
