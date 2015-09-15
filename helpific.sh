#!/bin/bash

mkdir -p /data/helpific/code /data/helpific/log /data/helpific/ssl
cd /data/helpific/code

git clone https://github.com/argoroots/helpific.git ./
git checkout master
git pull

version=`date +"%y%m%d.%H%M%S"`

docker build -q -t helpific:$version ./ && docker tag -f helpific:$version helpific:latest
docker stop helpific
docker rm helpific
docker run -d \
    --name="helpific" \
    --restart="always" \
    --memory="512m" \
    --env="PORT=80" \
    --env="COOKIE_SECRET=" \
    --env="NEW_RELIC_APP_NAME=helpific" \
    --env="NEW_RELIC_LICENSE_KEY=" \
    --env="NEW_RELIC_LOG=stdout" \
    --env="NEW_RELIC_LOG_LEVEL=error" \
    --env="NEW_RELIC_NO_CONFIG_FILE=true" \
    --env="ENTU_USER=" \
    --env="ENTU_KEY=" \
    --env="SENTRY_DSN=" \
    --volume="/data/helpific/log:/usr/src/helpific/log" \
    helpific:latest

/data/nginx.sh
