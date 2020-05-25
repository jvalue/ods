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

## API
| Endpoint  | Method  | Request Body  | Response Body | Description |
|---|---|---|---|---|
| *base_url*/ | GET | - | text | Get health status |
| *base_url*/version | GET | - | text | Get service version |
| *base_url*/job | POST | transformationRequest | jobResult | Trigger execution |


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
