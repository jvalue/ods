#!/bin/bash

# abort if any command fails
set -e

dir=$(dirname "$0")
cd ${dir}/../..
docker-compose -f docker-compose.yml -f docker-compose.consumer.yml build storage-mq
docker-compose -f docker-compose.yml -f docker-compose.consumer.yml up --exit-code-from storage-mq --no-deps storage-mq
