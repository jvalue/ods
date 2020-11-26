# Docker Dependencies

## Motivation

The ODS uses docker images for both development, testing and deployment.

It is crucial that we regularly update the used image versions to stay up-to-date.
Note that we do not use e.g. the `latest` tag to avoid pulling in breaking changes.

## Places in which docker images are used

- development and unit-test `Dockerfiles` for the services _adapter_, _notification_, _pipeline_, _scheduler_, _storage/storage-mq_, _ui_.
- self-extended `Dockerfiles` for _storage/liquibase_, _storage/postgrest_.
- integration tests `Dockerfiles` for _adapter_, _notification_, _pipeline_, _scheduler_, _storage_, _ui_.
- `Dockerfiles` for _system-test_.
- `docker-compose` dependencies for services like _edge_, _databases_ or _rabbitmq_.
- GitHub CI Workflow

## Used docker image versions

Last Update: November 2020.

### Node

All services and their integration tests written in JavaScript and the system test use the official Node.js image `node`. The image version `14-alpine` is used as Node.js 14 is the current LTS-version.

### Java

For Java the `OpenJDK` images provided by `AdoptOpenJDK` are used, as `AdoptOpenJDK` provides `alpine` images.
See [here](https://github.com/AdoptOpenJDK/openjdk-docker) for background information.
We use version 15 of OpenJDK as it is the latest version, as seen [here](https://www.oracle.com/java/technologies/java-se-support-roadmap.html)

### PostgreSQL

We use the official `postgres` images.
We use the version `13-alpine` as it is the latest version.
For PostgreSQL versioning see [here](https://www.postgresql.org/support/versioning/).

### RabbitMQ, PostgREST, Liquibase, Traefik, nginx

For RabbitMQ we use the official `rabbitmq` image in version `3-management-alpine`.

For PostgREST we use the official `postgrest` image in version `v7.0.1` (attention: no automatic update inside v7).

For Liquibase we use the `webdevops:liquibase` image in version `postgres`.

For nginx we use the official `nginx` image in version `1-alpine`.

### Ubuntu Image for CI

We use `ubuntu-18.04` which is also used if you use `latest`.
See [here](https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-syntax-for-github-actions#jobsjob_idruns-on) for details.