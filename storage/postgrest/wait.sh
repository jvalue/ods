#!/bin/sh

printf 'Waiting for %s to be ready\n' ${DATABASE_URL}

sleep 5 # if db is started for first try it has to apply some changes itself before being available

while $(curl --silent --head --fail ${DATABASE_URL}/ping); do
    printf 'Attempt failed to connect to Postgres... Retrying in a few seconds\n'
    sleep 2
done

printf 'Postgres is running... Ready to start PostgREST!\n'

exec "$@"
