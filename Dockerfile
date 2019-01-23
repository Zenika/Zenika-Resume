FROM node:5.7

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .
EXPOSE 3000
CMD ["npm", "start"]
