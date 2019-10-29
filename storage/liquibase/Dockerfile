FROM webdevops/liquibase:postgres

USER root
ENV DATABASE_URL=$LIQUIBASE_URL

COPY ./changelog.xml /liquibase/changelog.xml
ENV LIQUIBASE_CHANGELOG=/liquibase/changelog.xml

COPY ./entrypoint.sh /docker_entrypoint.sh
RUN chmod +x /docker_entrypoint.sh

CMD /docker_entrypoint.sh
