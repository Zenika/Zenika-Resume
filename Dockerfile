FROM node:5.7

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

COPY server.js .
EXPOSE 3000
CMD ["npm", "start"]
