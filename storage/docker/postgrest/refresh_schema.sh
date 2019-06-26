#!/bin/bash

while true; do
    printf 'Refreshing PostgREST schema...\n'
    $(pkill -SIGUSR1 postgrest)
    sleep 20
done
