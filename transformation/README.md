# Open Data Service - Transformation-Service

## Getting started

Make sure they Keycloak container is running (see `../auth`).

## Build

`npm install`

`npm run tsc`

## Run

`npm start`

## Running in watch mode

Use `npm run watch` to concurrently start the `tsc` compiler as well as run the service. It automatically reloads after file changes.

## Running unit tests

Use `npm test` to run the unit tests. There is also `nrm run watch-test` available to start `jest` in "watch mode".

## Running end-to-end tests

TBD

## EVENT QUEUES

For inner collaboration between the microservices event queues will be used to 
exchange data and information between the services.

This is done by connecting to a AMQP-Service (rabbitmq) and consume or publish events to 
its queues.

The transformation service interacts with three Queues:
  - AdapterData queue   (transformation service acts as a event consumer)
  - Notification queue  (transformation service acts as a event publisher)
  - ODS-Data queue      (transformation service acts as a event publisher)

Events:
-------
| Event Type | Queue | publisher | consumer | Payload | description
|---|---|---|---|---|---|
| AdapterData Event | AdapterData queue| Adapter service| Transformation Service | AdapterData Event | Will sent to the transformation service after successful data import |
| Transformation Event | Notification queue| Transformation service| Notification Service | Transformation Event | Will sent to the notification service after failed or successful transformation |

### AdapterData queue 

The purpose of this queue is to exchange events between the adapter service and the transformation service via `AdapterData Event`.
This data will be transformed by the transformation service.

The correspondig pipeline configs will be extracted from the database (identified by datasourceId) 
in order to execute the transformation, notification and persistence for the pipeline.

AdapterData Event
-----------------
```
{
  datasourceId: number
  data: object | undefined
  dataLocation: string | undefined
}
```

This can be currently achieved in two ways:
  - Adapter sends the data within the Event, by setting the field data of the AdapterData Event (--> Fat Event)
  - Adapter sends a reference to its REST-API, where the data can be extracted from, by setting the field dataLocation (--> Thin Event)

If both are set, the data will be directly extracted for further processing.

### Notification queue

After successful transformation of the data (received from adapter service) 
a TransformationEvent will be published to the Notification Queue, that contains all relevant information, 
regarding the processing results of the pipeline.

Transformation Event
---------------------
```
{
  pipelineId: number      // ID of the pipeline
  pipelineName: string    // Name of the pipeline

  dataLocation: string    // url (location) of the data

  jobResult: JobResult    // see JobResult (in API section)
}
```



## API
| Endpoint  | Method  | Request Body  | Response Body | Description |
|---|---|---|---|---|
| *base_url*/ | GET | - | text | Get health status |
| *base_url*/version | GET | - | text | Get service version |
| *base_url*/job | POST | transformationRequest | jobResult | Trigger execution |
| *base_url*/config | GET | - | text | Get health status |
| *base_url*/config | POST | PipelineConfig | persisted PipelineConfig | Get health status |
| *base_url*/config/{id} | PUT | PipelineConfig | updated PipelineConfig | Updates a pipeline config for given {id} with data of the body (=PipelineConfig) |
| *base_url*/config/{id} | DELETE | - | - | Deletes a pipeline config for given {id} |


### TransformationRequest
```
{
  "data": object | undefined
  "dataLocation": object | undefined
  "func": string [VALID JS CODE]
}
```

### JobResult 
```
{
  "data"?: object,
  "error"?: object,
  "stats": stats
}
```

## License

Copyright 2018 Friedrich-Alexander Universität Erlangen-Nürnberg

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
