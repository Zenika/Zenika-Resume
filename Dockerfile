FROM node:5.7

COPY . /root
WORKDIR /root
RUN npm install --global yarn@^1.0.0
# this also builds the app through the post-install script
RUN yarn

EXPOSE 3000
CMD ["yarn", "start"]
