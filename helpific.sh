#!/bin/bash

mkdir -p /opt/helpific/code /opt/helpific/ssl
cd /opt/helpific/code

git clone -q https://github.com/argoroots/helpific.git ./
git checkout -q master
git pull
printf "\n\n"

version=`date +"%y%m%d.%H%M%S"`
docker build --quiet --pull --tag=helpific:$version ./ && docker tag -f helpific:$version helpific:latest
printf "\n\n"

docker stop helpific
docker rm helpific
docker run -d \
    --name="helpific" \
    --restart="always" \
    --volume="/opt/helpific/logs:/var/log/helpific" \
    --env="NODE_ENV=production" \
    --env="VERSION=$version" \
    --env="PORT=80" \
    --env="LOGLEVEL=trace" \
    --env="COOKIE_SECRET=" \
    --env="ADMIN_EMAILS=support@helpific.com" \
    --env="FEEDBACK_EMAILS=feedback@helpific.com" \
    --env="NEW_RELIC_APP_NAME=helpific" \
    --env="NEW_RELIC_LICENSE_KEY=" \
    --env="NEW_RELIC_LOG=stdout" \
    --env="NEW_RELIC_LOG_LEVEL=error" \
    --env="NEW_RELIC_NO_CONFIG_FILE=true" \
    --env="ENTU_USER=" \
    --env="ENTU_KEY=" \
    --env="CORE_URL=http://core.helpific.ee:8080" \
    --env="AUTH_CORE_URL=https://core.helpific.ee" \
    --env="SENTRY_DSN=" \
    helpific:latest

docker inspect -f "{{ .NetworkSettings.IPAddress }}" helpific
printf "\n\n"

/opt/nginx.sh