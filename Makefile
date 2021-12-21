.PHONY: push-docker build-docker build-docker-from-local

TOP_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

# get the latest commit hash in the short form
COMMIT := $(shell git rev-parse --short HEAD)
REPOSITORY := aresprotocollab/ares_gladios
# one of [docker-pre, docker, prod]. angular.json/projects:architect:build:configurations
BUILDER_CONFIGURATION := docker-pre

NGINX_CONF := nginx/polkascan-prod.conf

# all of above variables, could be overrode by.env
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

push-docker:
	docker tag ${REPOSITORY}:${COMMIT} ${REPOSITORY}:latest
	docker push ${REPOSITORY}:${COMMIT}
	docker push ${REPOSITORY}:latest

build-docker-from-local:
	npm run ng build -- --configuration=${BUILDER_CONFIGURATION} --output-path=dist
	docker build --build-arg NGINX_CONF=${NGINX_CONF} -t ${REPOSITORY}:${COMMIT} -f docker-from-local.dockerfile .


build-docker:
	docker build --build-arg NGINX_CONF=${NGINX_CONF} --build-arg ENV_CONFIG=${BUILDER_CONFIGURATION} -t ${REPOSITORY}:${COMMIT} -f Dockerfile .
