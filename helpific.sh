#!/bin/bash

mkdir -p /data/helpific/code /data/helpific/ssl
cd /data/helpific/code

git clone -q https://github.com/argoroots/helpific.git ./
git checkout -q master
git pull
printf "\n\n"

version=`date +"%y%m%d.%H%M%S"`
docker build -q -t helpific:$version ./ && docker tag -f helpific:$version helpific:latest
printf "\n\n"

docker stop helpific
docker rm helpific
docker run -d \
    --name="helpific" \
    --restart="always" \
    --memory="512m" \
    --env="VERSION=$version" \
    --env="PORT=80" \
    --env="LOGLEVEL=error" \
    --env="COOKIE_SECRET=" \
    --env="ADMIN_EMAILS=" \
    --env="FEEDBACK_EMAILS=" \
    --env="CORE_URL=http://core.helpific.ee:8080" \
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

docker inspect -f "{{ .NetworkSettings.IPAddress }}" helpific
printf "\n\n"

/data/nginx.sh
