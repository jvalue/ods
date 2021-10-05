#!/bin/bash

dir=$(dirname "$0")
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.consumer.yml" build ui
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.consumer.yml" up ui
