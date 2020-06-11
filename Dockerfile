FROM node:5.7 AS front

# This brings global node_modules into the current file system layer so that
# npm can then be updated correctly. See https://github.com/npm/npm/issues/13306
# and https://blog.cloud66.com/using-node-with-docker/
# Then update npm to avoid this bug: https://github.com/npm/cli/issues/681
# NOTE: these 3 commands need to be run all at once
RUN mv /usr/local/lib/node_modules /usr/local/lib/node_modules.tmp \
  && mv /usr/local/lib/node_modules.tmp /usr/local/lib/node_modules \
  && npm install --quiet --global npm@3.10.10

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install --quiet

COPY app/ app/
COPY lib lib/
COPY webpack.config.js .
COPY app.json .
COPY build-path.js .
COPY .babelrc .
RUN npm run build

FROM node:12.0
COPY --from=front /app/build/ /server/build/
WORKDIR /server/server

COPY server/package.json .
COPY server/package-lock.json .
RUN npm ci
COPY server/server.js .
COPY server/build-path.js .


EXPOSE 3000

WORKDIR /server/server
CMD ["npm", "start"]
