FROM postgrest/postgrest

COPY ./refresh_schema.sh /refresh_schema.sh
RUN chmod +x /refresh_schema.sh

CMD ./refresh_schema.sh & \
    exec postgrest /etc/postgrest.conf