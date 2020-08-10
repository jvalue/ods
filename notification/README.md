# Open Data Service - Notification-Service

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
| *base_url*/webhook | POST | webhookRequest | - | Trigger webhook |
| *base_url*/slack | POST | slackRequest | - | Trigger slack notification |
| *base_url*/fcm | POST | firebaseRequest | - | Trigger firebase notification |


### WebhookRequest
```
{
  "pipelineName": string,
  "pipelineId": string,
  "data": object,
  "dataLocation": string,
  "condition": string,
  "type": "WEBHOOK"
  "url": string
}
```

### SlackRequest
```
{
  "pipelineName": string,
  "pipelineId": string,
  "data": object,
  "dataLocation": string,
  "condition": string,
  "notificationType": "SLACK",
  "workspaceId": string,
  "channelId": string,
  "secret": string
}
```

### FirebaseRequest
```
{
  "pipelineName": string,
  "pipelineId": string,
  "data": object,
  "dataLocation": string,
  "condition": string,
  "notificationType": "FCM",
  "projectId": string,
  "clientEmail": string,
  "privateKey": string,
  "topic": string
}
```


### Slack notification walkthrough
* Create a slack app for your slack channel and enable activations as discribed [here](https://api.slack.com/messaging/webhooks).
* Determine your apps' incoming webhook url at the slack [dashboard](https://api.slack.com/apps).
* POST a slackRequest under the endpoint ```/notification/slack```. The workspaceId, channelId and secret fields can be taken from the parts of the incoming webhook url (separated by '/', in the given order).
* Go to your configured channel and be stunned by the magic. 

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
