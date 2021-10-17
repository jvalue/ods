#!/bin/bash

# abort if any command fails
set -e

dir=$(dirname "$0")
cd ${dir}/..
docker-compose -f docker-compose.yml -f docker-compose.provider.yml build pipeline pipeline-db pipeline-outboxer rabbitmq
docker-compose -f docker-compose.yml -f docker-compose.provider.yml up --exit-code-from pipeline pipeline pipeline-db pipeline-outboxer rabbitmq
