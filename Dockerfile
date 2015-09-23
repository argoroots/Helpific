FROM node:4-slim

ADD ./ /usr/src/helpific
RUN cd /usr/src/helpific && npm --silent --production install

CMD ["node", "/usr/src/helpific/master.js"]
