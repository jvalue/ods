FROM postgrest/postgrest

USER root

RUN apt-get update \
    # workaround for psql on debian-stretch: https://github.com/debuerreotype/debuerreotype/issues/10
    && for i in $(seq 1 8); do mkdir -p "/usr/share/man/man${i}"; done \
    && apt-get install -y postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD /entrypoint.sh
