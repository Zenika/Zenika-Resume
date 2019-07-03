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

WORKDIR /server
COPY --from=front /app/build/ build/
COPY app/DecryptUtils.js app/
COPY build-path.js .
RUN npm init -y
RUN npm install sjcl

EXPOSE 3000

WORKDIR /server/server
CMD ["npm", "start"]
