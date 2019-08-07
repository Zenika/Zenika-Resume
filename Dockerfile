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

FROM node:12.4

WORKDIR /server/server

COPY server/package.json .
COPY server/package-lock.json .
RUN npm install
COPY server/server.js .

EXPOSE 3000

WORKDIR /server/server
CMD ["npm", "start"]
