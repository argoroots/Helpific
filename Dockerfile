FROM node:slim

COPY ./ /usr/src/helpific
RUN cd /usr/src/helpific && npm install

ENTRYPOINT ["node", "/usr/src/helpific/app.js"]
