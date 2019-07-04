# Storage Service of the ODS

The storage service is responsible for storing data and making it available via a query API.

## Current Implementation
The current implementation consists of the following parts:
* PostgreSQL database in the background
* Liquibase as >>source control<< for the database
* PostgREST as wrapping microservice with REST API

## Getting Started

* Build all containers with `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml build storage-service-db-liquibase storage-service`
* Run all containers with `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up storage-service-db storage-service-db-liquibase storage-service-db-ui storage-service storage-service-swagger` (includes Adminer on port 8081 as UI for db, Swagger-UI as UI on port 8080 for REST API, Integration Tests)
Note that you need to delete existing docker images from your local docker daemon to have recent changes integrated: `docker system prune -f && docker volume prune -f`
* For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up storage-service-db storage-service-db-liquibase storage-service storage-service-it`.

## API
| Endpoint  | Method  | Request Body  | Response Body |
|---|---|---|---|
| *base_url*/rpc/createStructureForDatasource  | POST  | `{pipelineid: "the-pipeline-id"}` | - |
| *base_url*/rpc/deleteStructureForDatasource  | POST  | `{pipelineid: "the-pipeline-id"}` | - |
| *base_url*/{the-pipeline-id}_data  | POST  | `{data: {<<json object>>}}` | - |
| *base_url*/{the-pipeline-id}_data  | GET  | - | `{id:123, data: {<<json object>}}` |
| *base_url*/{the-pipeline-id}_metadata  | POST  | `{'timestamp': '2004-10-19 10:23:54', 'origin': 'origin', 'license': 'license', 'pipelineId': 'pipelineid','id_data': 1}` | - |
| *base_url*/{the-pipeline-id}_metadata  | GET  | - | `{id:123, timestamp': '2004-10-19 10:23:54', 'origin': 'origin', 'license': 'license', 'pipelineId': 'pipelineid','id_data': 1}` |

When nothing is changed *base_url* is `http://localhost/3000`