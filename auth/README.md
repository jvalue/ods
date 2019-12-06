# Authentication

## Introduction

## Getting Started

Run `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up auth-service-db auth-service` to start Keycloak service with the configuration from the `ods-userservice-realm.json` file.

Keycload configuration UI is available on url `http://localhost:8080/auth/`. The default username is `admin` and default password is `Pa55w0rd`.

A demo user with username `demo` and password `demo` is also created.

## Changing the Configuration

Make sure to delete the database volume, e.g. by `docker volume prune`, otherwise the old configuration is still active!

## Shutting down

Use `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up down` to stop the auth service.
