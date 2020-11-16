# Storage Service of the ODS

The storage service is responsible for storing data and making it available via a query API.

## Current Implementation
The current implementation consists of the following parts:
* PostgreSQL database in the background
* Liquibase as >>source control<< for the database
* PostgREST as wrapping microservice with REST API

## Getting Started

* Build all containers with `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml --env-file ../.env build storage-db-liquibase storage`
* Run all containers with `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml --env-file ../.env up storage-db storage-db-liquibase storage-db-ui storage storage-swagger` (includes Adminer on port 8081 as UI for db, Swagger-UI as UI on port 8080 for REST API, Integration Tests)
Note that you need to delete existing docker images from your local docker daemon to have recent changes integrated: `docker system prune -f && docker volume prune -f`
* For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml --env-file ../.env up storage-db storage-db-liquibase storage storage-it`.
* After running integration tests dependant services (e.g. rabbit-mq) keep running. In order to stop all services and return to a clean, initial state run `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml down`. 


## API
| Endpoint  | Method  | Request Body  | Response Body |
|---|---|---|---|
| *base_url*/rpc/createStructureForDatasource  | POST  | `{pipelineid: "the-pipeline-id"}` | - |
| *base_url*/rpc/deleteStructureForDatasource  | POST  | `{pipelineid: "the-pipeline-id"}` | - |
| *base_url*/{the-pipeline-id}  | POST  | `{data: {<<json object>>}, timestamp: "<<timestamp>>", origin: "<<origin>>", license: "<<license>>", pipelineId: "<<pipelineId>>}` | - |
| *base_url*/{the-pipeline-id} | GET  | - | `{data: {<<json object>>, timestamp: "<<timestamp>>", origin: "<<origin>>", license: "<<license>>", pipelineId: "<<pipelineId>>}` |

When nothing is changed *base_url* is `http://localhost/3000`
