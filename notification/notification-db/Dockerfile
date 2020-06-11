FROM postgres:latest

# ================================
# CREATE DATABASE AND TABLES
# ================================
RUN /bin/bash -c 'echo -e "\
#!/bin/bash \n\
set -e \n\
psql -v ON_ERROR_STOP=1 --username \"\$POSTGRES_USER\" <<-EOSQL \
\n\
    CREATE TABLE BASE_CONF ( \n\
        PIPELINE_NAME   VARCHAR(215), \n\
        PIPELINE_ID     VARCHAR(215), \n\
        DATA            TEXT, \n\
        DATA_LOCATION   VARCHAR(215), \n\
        CONDITION       TEXT, \n\
        TYPE            VARCHAR(256), \n\
    PRIMARY KEY(PIPELINE_ID) \n\
    );\
\n\
\n\
    CREATE TABLE WEBHOOK ( \n\
        URL             VARCHAR(512), \n\
        BASE_CONF       VARCHAR(215), \n\
    FOREIGN KEY(BASE_CONF) REFERENCES BASE_CONF(PIPELINE_ID), \n\
    PRIMARY KEY(BASE_CONF) \n\
    ); \
\n\
\n\
    CREATE TABLE SLACK ( \n\
        WORKSPACE_ID    VARCHAR(215), \n\
        CHANNEL_ID      VARCHAR(215), \n\
        SECRET          VARCHAR(2048), \n\
        BASE_CONF       VARCHAR(215), \n\
    FOREIGN KEY(BASE_CONF) REFERENCES BASE_CONF(PIPELINE_ID), \n\
    PRIMARY KEY(BASE_CONF) \n\
    ); \
\n\
\n\
    CREATE TABLE FCM ( \n\
        PROJECT_ID      VARCHAR(512), \n\
        EMAIL           VARCHAR(512), \n\
        PRIVATE_KEY     VARCHAR(2048), \n\
        TOPIC           VARCHAR(512), \n\
        BASE_CONF       VARCHAR(215), \n\
    FOREIGN KEY(BASE_CONF) REFERENCES BASE_CONF(PIPELINE_ID), \n\
    PRIMARY KEY(BASE_CONF) \n\
    );\n\
EOSQL"\
> /docker-entrypoint-initdb.d/init-tables-db.sh' &&\
apt-get update &&\
apt-get -y install telnet 