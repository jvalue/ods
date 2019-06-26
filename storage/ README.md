# Storage Service of the ODS

The storage service is responsible for storing data and making it available via a query API.

## Current Implementation
The current implementation consists of the following parts:
* PostgreSQL database in the background
* Liquibase as >>source control<< for the database
* PostgREST as wrapping microservice with REST API

## Getting Started

* Build all conainers with `docker-compose -f ./deploy/compose/docker-compose.yml build`
* Run all conainers with `docker-compose -f ./deploy/compose/docker-compose.yml up` (includes Adminer on port 8081 as UI for db, Swagger-UI as UI on port 8080 for REST API, Integration Tests)
Note that you need to delete existing docker images from your local docker daemon to have recent changes integrated. For development, you can use the following command:
`docker system prune -f && docker volume prune -f && docker-compose -f ./deploy/compose/docker-compose.yml build && docker-compose -f ./deploy/compose/docker-compose.yml up`

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