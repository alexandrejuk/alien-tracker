FROM node:8-alpine

COPY package.json /server/package.json
COPY yarn.lock /server/yarn.lock
WORKDIR /server

RUN apk --update add --no-cache python make g++
RUN if [ "x$NODE_ENV" == "xproduction" ]; then yarn install --production ; else yarn install ; fi

COPY src /server/src

EXPOSE 3000