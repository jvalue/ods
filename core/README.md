# Core Service of the ODS
The core service stores and exposes pipeline configurations, which define the stream of data from a data source via transformations to storage and notifications.
It also exposes an event log of all modifications to the pipeline configurations to allow further processing by the ods.

## Current Features
* Management and persistence of pipeline configurations
* Exposure of an event log containing all modifications to the pipeline configurations

## Planned Features

## Getting Started

* Build with `./gradlew build`
* Run unit tests with `./gradlew test`
* Run integration test with `./gradlew integrationTest` (note that a instance of the coreService needs to be up).
* Start with `./gradlew bootRun`  (note that a instance of the database needs to be up, use docker-compose) - <b>not recommended</b>
* Use Docker-Compose: `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up core-service core-service-db` builds Docker images and starts them up. 
* For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.ci.yml up core-service core-service-db core-service-it`
Note that you need to delete existing docker images from your local docker daemon to have recent changes integrated. 

## API Docs

Coming soon via Swagger UI
