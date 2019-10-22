FROM webdevops/liquibase:postgres

COPY ./wait.sh /wait.sh
RUN chmod +x /wait.sh
ENV DATABASE_URL=$LIQUIBASE_URL

COPY ./changelog.xml /liquibase/changelog.xml
ENV LIQUIBASE_CHANGELOG=/liquibase/changelog.xml

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["/wait.sh && /entrypoint update"]
