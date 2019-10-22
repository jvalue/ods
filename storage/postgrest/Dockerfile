FROM postgrest/postgrest:v6.0.0

# overwrite:
ENV DATABASE_URL=jdbc:postgresql://localhost:5432/ods

COPY ./wait.sh /wait.sh
USER root
RUN chmod +x /wait.sh

RUN apt update \
    && apt install -y curl \
    && rm -rf /var/lib/apt/lists/*

CMD /wait.sh && exec postgrest /etc/postgrest.conf
