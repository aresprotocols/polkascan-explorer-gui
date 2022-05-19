### STAGE 1: Build ###
# We label our stage as ‘builder’
FROM node:14-alpine as builder

COPY package.json yarn.lock ./

## Storing node modules on a separate layer will prevent unnecessary npm installs at each build
RUN apk add --no-cache python2 g++ make && \
    yarn install && mkdir /ng-app && mv ./node_modules ./ng-app

WORKDIR /ng-app

COPY . /ng-app/

## Build the angular app in production mode and store the artifacts in dist folder
ARG ENV_CONFIG=docker-pre
ENV ENV_CONFIG=$ENV_CONFIG

ARG DISCOVERY_API_URL=https://discovery-31.polkascan.io
ENV DISCOVERY_API_URL=$DISCOVERY_API_URL

ARG API_URL=https://host-01.polkascan.io/kusama/api/v1
ENV API_URL=$API_URL

ARG NETWORK_NAME=Ares
ENV NETWORK_NAME=$NETWORK_NAME

ARG NETWORK_ID=ares
ENV NETWORK_ID=$NETWORK_ID

ARG NETWORK_TYPE=pre
ENV NETWORK_TYPE=$NETWORK_TYPE

ARG CHAIN_TYPE=relay
ENV CHAIN_TYPE=$CHAIN_TYPE

ARG NETWORK_TOKEN_SYMBOL=ARES
ENV NETWORK_TOKEN_SYMBOL=$NETWORK_TOKEN_SYMBOL

ARG NETWORK_TOKEN_DECIMALS=12
ENV NETWORK_TOKEN_DECIMALS=$NETWORK_TOKEN_DECIMALS

ARG NETWORK_COLOR_CODE=d32e79
ENV NETWORK_COLOR_CODE=$NETWORK_COLOR_CODE

RUN npm run ng build -- --configuration=${ENV_CONFIG} --output-path=dist


### STAGE 2: Setup ###
FROM nginx:1.14.1-alpine

ARG NGINX_CONF=nginx/polkascan-prod.conf
ENV NGINX_CONF=$NGINX_CONF

## Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/*

## Copy our default nginx config
#COPY nginx/polkascan.conf /etc/nginx/conf.d/
COPY ${NGINX_CONF} /etc/nginx/conf.d/

## Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

## From ‘builder’ stage copy over the artifacts in dist folder to default nginx public folder
COPY --from=builder /ng-app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
