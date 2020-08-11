#!/bin/bash

export DATABASE_URL="${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
export LIQUIBASE_URL="jdbc:postgresql://${DATABASE_URL}"
export LIQUIBASE_USERNAME="${DATABASE_USER}"
export LIQUIBASE_PASSWORD="${DATABASE_PW}"

printf 'Waiting for %s to be ready\n' "${DATABASE_URL}"
for (( i=0; i<${CONNECTION_RETRIES}; i++ )); do
  sleep ${CONNECTION_BACKOFF_IN_SECONDS} # if db is started for first try it has to apply some changes itself before being available
  printf 'Try to perform liquibase update!\n'
  /entrypoint update
  if [ $? == "0" ]; then
    break # Liquibase update was successful
  fi
done
