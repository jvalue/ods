FROM webdevops/liquibase:postgres

COPY ./wait.sh /wait.sh
RUN chmod +x /wait.sh

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["/wait.sh && /entrypoint update"]