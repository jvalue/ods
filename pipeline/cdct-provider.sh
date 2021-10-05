#!/bin/bash

dir=$(dirname "$0")
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.provider.yml" build pipeline pipeline-db pipeline-outboxer rabbitmq
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.provider.yml" up --exit-code-from pipeline pipeline pipeline-db pipeline-outboxer rabbitmq
