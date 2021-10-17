#!/bin/bash

# abort if any command fails
set -e

dir=$(dirname "$0")
cd ${dir}/..
docker-compose -f docker-compose.yml -f docker-compose.consumer.yml build ui
docker-compose -f docker-compose.yml -f docker-compose.consumer.yml up --exit-code-from ui --no-deps ui
