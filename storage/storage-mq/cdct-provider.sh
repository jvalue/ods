#!/bin/bash

# abort if any command fails
set -e

dir=$(dirname "$0")
cd ${dir}/../..
docker-compose -f docker-compose.yml -f docker-compose.provider.yml build storage storage-db storage-mq storage-db-liquibase
docker-compose -f docker-compose.yml -f docker-compose.provider.yml up --exit-code-from storage-db-liquibase storage-db storage-db-liquibase
docker-compose -f docker-compose.yml -f docker-compose.provider.yml up --exit-code-from storage-mq --no-deps storage storage-db storage-mq
