#!/bin/bash

# abort if any command fails
set -e

dir=$(dirname "$0")
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.consumer.yml" build notification
docker-compose -f "${dir}/../docker-compose.yml" -f "${dir}/../docker-compose.consumer.yml" up --exit-code-from notification --no-deps notification
