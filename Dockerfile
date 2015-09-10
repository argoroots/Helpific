FROM node:4.0-slim

ADD ./ /usr/src/helpific
RUN cd /usr/src/helpific && npm install

CMD ["node", "/usr/src/helpific/master.js"]
