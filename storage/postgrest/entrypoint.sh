#!/bin/bash

export PGRST_DB_URI="postgres://${DATABASE_USER}:${DATABASE_PW}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"
export PGRST_DB_SCHEMA=storage
#In production this role should not be the same as the one used for the connection
export PGRST_DB_ANON_ROLE="${DATABASE_USER}"

psql --version
printf 'Waiting for %s to be ready\n' "${DATABASE_URL}"

(( max_retry=30 ))
(( current_retry=1 ))

export PGPASSWORD=${DATABASE_PW}
until psql -h "${DATABASE_HOST}" -p "${DATABASE_PORT}" -U "${DATABASE_USER}" -d "${DATABASE_NAME}" -c "select (1)" > /dev/null 2>&1 \
        || [ ${current_retry} -gt ${max_retry} ]; do
    printf "Attempt failed to connect to Postgres. (%s / %s)\n" "${current_retry}" "${max_retry}"
    current_retry=$(( current_retry + 1 ))
    sleep 1
done

printf 'Try to start PostgREST!\n'
exec postgrest /etc/postgrest.conf
