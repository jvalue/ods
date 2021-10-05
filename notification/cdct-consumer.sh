#!/bin/bash

dir=$(dirname "$0")
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.consumer.yml" build notification
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.consumer.yml" up notification
