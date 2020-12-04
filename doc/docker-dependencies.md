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

Last Update: _November 2020_.

Wherever possible we trust the image creators to follow [semantic versioning](https://semver.org/).
For this reason we try to specify major versions so we automatically get the latest updates without having to check for breaking API changes.

### Node

All services and their integration tests written in JavaScript and the system test use the official Node.js image [`node`](https://hub.docker.com/_/node). The image version `14-alpine` is used as Node.js 14 is the current LTS-version.

### Java

For Java the OpenJDK [OpenJ9](https://www.eclipse.org/openj9) images provided by [`AdoptOpenJDK`](https://hub.docker.com/_/adoptopenjdk) are used, in the `alpine-slim` version.
OpenJ9 is a implementation of the JVM specifically designed for microservices and usage in the cloud.
See [here](https://github.com/AdoptOpenJDK/openjdk-docker) for background information.
We currenly use version 14 of OpenJDK. See [here](https://www.oracle.com/java/technologies/java-se-support-roadmap.html) for the version roadmap of Java.

### PostgreSQL

We use the official [`postgres`](https://hub.docker.com/_/postgres) images.
We use the version `13-alpine` as it is the latest version.
For PostgreSQL versioning see [here](https://www.postgresql.org/support/versioning/).

### RabbitMQ

For RabbitMQ we use the official [`rabbitmq`](https://hub.docker.com/_/rabbitmq) image in version `3-management-alpine`.

### PostgREST

For PostgREST we use the official [`postgrest`](https://hub.docker.com/r/postgrest/postgrest/) image in version `v7.0.1`.
PostgREST does not offer tags that follow the semantic versioning docker tag style, so we have to specify a version.

### Liquibase

For Liquibase we use the [`webdevops:liquibase`](https://hub.docker.com/r/webdevops/liquibase) image in version `postgres`.

### Traefik

For Traefik we use the official [`traefik`](https://hub.docker.com/_/traefik) image in the latest version `2.3`.

### nginx
For nginx we use the official [`nginx`](https://hub.docker.com/_/nginx) image in version `1-alpine`.

### Ubuntu Image for CI

We use `ubuntu-18.04` which is also used if you use `latest`.
See [here](https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-syntax-for-github-actions#jobsjob_idruns-on) for details.
See also [this](https://github.com/actions/virtual-environments/issues/1816) for changing to `ubuntu-20.04`.