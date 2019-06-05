# Adapter Service of the ODS
The adapter service fetches data from external data sources and provides them via a HTTP API in JSON format. 
The data coming from the external sources can be fetched over various protocols and can have various formats.
## Current Features
* Currently the adapter service is only a prototype and can handle only JSON files that can be fetched over HTTP.
## Planned Features
The handling of new protocols and formats is going to be implemented. 

Planned protocols:
* ftp

Planned formats:
* xml
* csv

## Getting Started

* Build with `./gradlew build`
* Run unit tests with `./gradlew test`
* Run integration test with `./gradlew integrationTest` (note that a instance of the adapterService needs to be up).
* Start with `./gradlew bootRun`  - <b>not recommended</b>
* Use Docker-Compose: `docker-compose -f deploy/compose/docker-compose.yml up` builds Docker images and starts them up. 
Note that you need to delete existing docker images from your local docker daemon to have recent changes integrated. 

## API
| Endpoint  | Method  | Request Body  | Response Body |
|---|---|---|---|
| *base_url*/api/version  | GET  | -  | String containing the API Version  |
| *base_url*/dataImport  | POST  | AdapterConfig file  | JSON representation of the imported data  |

When nothing is changed *base_url* is `http://localhost/8080`
### Adapter Config
Currently the AdapterConfig is JSON File consisting of only three nodes:


```
{
    "protocol": $$Data source protocol as string$$,
    "format": $$Format of the data from the external source as string$$,
    "location": $$URL of the data source as string$$
  }
  ```

## Architecture
Each adapter consists of a importer that is responsible for the handling of the data source protocol and a interpreter that reformats the given data to json format.
The implemented importers and interpreters are stored in a map in the AdapterManager.
For each request to the AdapterEndpoint, the AdapterManager chooses a appropriate Interpreter and Importer and creates an Adapter to handle the request.
Information about data format, protocal and location of the external data source to include are stored in a AdapterConfig file which is included in the request.
The basic architecture of the ODS is depicted below. 
Support for new protocols or data formats can easily be achieved by adding classes implementing the importer/interpreter interface and registering those classes in the AdapterManager.
![basic architecture of the adapter service](doc/basic_arch.png)


