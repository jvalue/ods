# Authentication

## Introduction

## Getting Started

Run `docker-compose -f deploy/compose/docker-compose.yml up -d` to start Keycloak service with the configuration from the `ods-userservice-realm.json` file.

Keycload configuration UI is available on url `http://localhost:8080/auth/`. The default username is `admin` and default password is `Pa55w0rd`.

A demo user with username `demo` and password `demo` is also created.

## Shutting down

Use `docker-compose -f deploy/compose/docker-compose.yml down` to stop the auth service.
