# Open Data Service - Pipeline-Service

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

* For integration testing run `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml --env-file ../.env up pipeline-it`.
  
* To analyze the logs of the service under test we recommend using lazydocker. Alternatively, you can attach manually to the pipeline container using the docker cli. 

* After running integration tests dependant services (e.g. rabbit-mq) keep running. In order to stop all services and return to a clean, initial state run `docker-compose -f ../docker-compose.yml -f ../docker-compose.it.yml down`. 


## API
| Endpoint  | Method  | Request Body  | Response Body | Description |
|---|---|---|---|---|
| *base_url*/ | GET | - | text | Get health status |
| *base_url*/version | GET | - | text | Get service version |
| *base_url*/job | POST | PipelineExecutionRequest | JobResult | Pipeline execution |
| *base_url*/trigger | POST | PipelineConfigTriggerRequest | text | Pipeline trigger |
| *base_url*/configs | GET | - | PipelineConfig[] | Get all pipeline configs |
| *base_url*/configs/:id | GET | - | PipelineConfig | Get pipeline config by id |
| *base_url*/configs | POST | PipelineConfigDTO | PipelineConfig | Create a pipeline config |
| *base_url*/configs/:id | PUT | PipelineConfigDTO | PipelineConfig | Update a pipeline config |
| *base_url*/configs/:id | DELETE | - | PipelineConfig | Delete a pipeline config by id |
| *base_url*/configs | DELETE | - | text | Delete all pipeline configs |

### PipelineExecutionRequest
```
{
  "data": object,
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

### PipelineConfigTriggerRequest
```
{
  "datasourceId": number,
  "data": object
}
```

### PipelineConfig
```
{
  "id": number,
  "datasourceId": number,
  "transformation": {
    "func": string [VALID JS CODE]
  },
  "metadata": {
    "author": string,
    "displayName": string,
    "license": string,
    "description": string,
    "creationTimestamp": Date
  }
}
```

### PipelineConfigDTO
```
{
  "datasourceId": number,
  "transformation": {
    "func": string [VALID JS CODE]
  },
  "metadata": {
    "author": string,
    "displayName": string,
    "license": string,
    "description": string,
  }
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
