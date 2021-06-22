#!/bin/sh

docker-compose -f ./docker-compose.yml -f ./../schema-recommendation/docker-compose.yml up -d adapter-db
sleep 3
docker-compose -f ./docker-compose.yml -f ./../schema-recommendation/docker-compose.yml up