FROM node:5.7 AS front

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install

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
