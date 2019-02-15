# Zenika Resume

A Markdown resume editor based on Monod (see the original Monod readme below).

## Running

For running locally or to build the production artifacts, see Installation in the Monod readme.
Keep it mind that running locally requires Node.js 5.7 (no more, no less).

### Docker Compose

`GOOGLE_ID=... GOOGLE_SECRET=... docker-compose up --build` should give you a running app on port 3000.
See below for how to set `GOOGLE_ID` and `GOOGLE_SECRET`.

### Docker

Build the provided Dockerfile, then run with the port 3000 mapped, and the following environment variables.

- `GOOGLE_CALLBACK`: callback for the Google authentication, set `http://localhost:3000/login/google/callback`
- `GOOGLE_ID`: client ID for the Google authentication, find the value from the production environment (see below)
- `GOOGLE_SECRET`: client secret for the Google authentication, find the value from the production environment (see below)
- `DATABASE_URL`: a connection string to a PostgreSQL instance; this is optional, withtout the app falls back to memory store
- `USER_AUTH_API_USERNAME`: basic auth username for web api
- `USER_AUTH_API_PASSWORD`: basic auth password for web api

## Production environment

The app is hosted on Heroku. The authentication is provided by Auth0.
Contact dsi@zenika.com to get access to either of those.

## Development 🛠

### 🐳 Docker Compose

Start PostgreSQL instance using docker-compose.yml

```
docker-compose up
```

### 🚜 Start server 

Create conf-google.js file for development
```
module.exports = {
    id: '1234567890.apps.googleusercontent.com',
    secret: 'soupersecretcode',
    callback: 'http://localhost:3000/login/google/callback',
}
```
And start your server with all environment variables
```
PGUSER=postgres \
  PGHOST=localhost \
  PGPASSWORD=zenikadev \
  DATABASE_URL=postgres \
  PGDATABASE=postgres \
  PGPORT=5432 \
  node server.js
```

### 🦄 Start front

```
npm run dev
```

### 💻 Start code !

# Monod

[![Circle CI](https://circleci.com/gh/TailorDev/monod.svg?style=svg)](https://circleci.com/gh/TailorDev/monod)

Monod is a (relatively) secure and offline-first Markdown editor we built at
TailorDev in order to learn [React.js](https://facebook.github.io/react/) (and a
bunch of JavaScript tools/libraries). We mainly dedicated two **Le lab** sessions
to this project:

* [Introducing Le lab with “Monod”, our Markdown
  Editor](https://tailordev.fr/blog/2016/03/11/introducing-le-lab-with-monod-our-markdown-editor/)
* [Le lab #2 — Offline-First, Document Sharing, Templates: Monod is Back (not in
  Black)](https://tailordev.fr/blog/2016/04/15/le-lab-2-offline-first-document-sharing-templates-monod-is-back/)

## Usage

Either you use our public instance at: https://monod.lelab.tailordev.fr/, or you
host Monod at home, on your server, or on Heroku.

[![Deploy to
Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Installation


### Production

    $ git clone https://github.com/TailorDev/monod.git
    $ npm install # will run `npm run build`
    $ npm prune --production

We use this
[Dockerfile](https://github.com/TailorDev/dockerfiles/blob/master/node/Dockerfile)
to run Monod in production (which runs `npm run start` from Monod root
directory).

### Development

    $ git clone https://github.com/TailorDev/monod.git
    $ npm install
    $ npm run dev

The last command runs the development server at
[`http://localhost:8080`](http://127.0.0.1:8080), and use Hot Module
Replacement. You can override the default host and port through env (`HOST`,
`PORT`).

You should also start the server by running:

    $ MONOD_DATA_DIR=/path/to/data npm run start

`MONOD_DATA_DIR` is an environment variable that configures where the server
is supposed to read/write Monod's data. It defaults to `./data/` (so be sure
to create this directory if you run `npm run start`).

You are all set!

### Other Commands

#### `npm run build`

Builds the client-side application in `build/` (production ready)

#### `npm run stats`

Webpack build + generate a JSON file with metrics. [We blogged on why it can be
useful](https://tailordev.fr/blog/2016/03/17/loading-dependencies-asynchronously-in-react-components/).

#### `npm run lint`

Runs [ESLint](http://eslint.org/).

#### `npm run lint:fix`

Fix all ESLint problems.


## Requirements

We use `node` 5.8+ and `npm` 3.7+.


## Contributing

Please, see [CONTRIBUTING](CONTRIBUTING.md) file.

## Running the Tests

    $ npm run test

You can also "watch" them:

    $ npm run test:watch

Code coverage is available by running:

    $ npm run cov


## Contributor Code of Conduct

Please note that this project is released with a [Contributor Code of
Conduct](http://contributor-covenant.org/). By participating in this project you
agree to abide by its terms. See [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) file.

## License

Monod is released under the MIT License. See the bundled [LICENSE](LICENSE.md)
file for details.
