FROM postgrest/postgrest

COPY ./refresh_schema.sh refresh_schema.sh

# Removed the following line because Docker somehow missed the execution rights from one day to another
# RUN chmod +x refresh_schema.sh

CMD refresh_schema.sh & \
    exec postgrest /etc/postgrest.conf