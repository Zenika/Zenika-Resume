FROM node:5.7

COPY . /root
WORKDIR /root
RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
