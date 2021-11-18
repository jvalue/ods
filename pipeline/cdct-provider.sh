#!/bin/bash

# abort if any command fails
set -e

dir=$(dirname "$0")
cd ${dir}/..

# remove containers that already exist which may distort the initial state of the service
containersToRemove=( "rabbitmq" "pipeline-db" )
for containerName in ${containersToRemove[@]}
do
  containerIds=$(docker ps -a -q --filter name=$(basename $PWD)_$containerName)
  [[ -n $containerIds ]] && docker rm -f -v $containerIds
done

docker-compose -f docker-compose.yml -f docker-compose.provider.yml build pipeline pipeline-db pipeline-outboxer rabbitmq
docker-compose -f docker-compose.yml -f docker-compose.provider.yml up --exit-code-from pipeline pipeline pipeline-db pipeline-outboxer rabbitmq