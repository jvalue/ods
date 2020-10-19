# Open Data Service - Notification-Service

## Build

`npm install`

`npm run transpile`

## Run

`npm start`

## Running unit tests

Use `npm test` to run the unit tests.

## Running end-to-end tests

Run integration tests in docker via the following command:

```docker-compose -f docker-compose.yml -f docker-compose.it.yml build notification notification-it && docker-compose -f docker-compose.yml -f docker-compose.it.yml up notification notification-it edge```


## API
| Endpoint  | Method  | Request Body  | Response Body | Description |
|---|---|---|---|---|
| *base_url*/ | GET | - | text | Get health status |
| *base_url*/version | GET | - | text | Get service version |
| *base_url*/configs | POST | NotificationWriteModel | - | Create a notification config |
| *base_url*/configs?pipelineId={pipelineId} | GET | - | NotificationReadModel[] | Get all notifications, filter by pipelineId if provided |
| *base_url*/configs/{id} | GET | - | NotificationReadModel | Get notification by id |
| *base_url*/configs/{id} | PUT | NotificationWriteModel | - | Update notification |
| *base_url*/configs/{id} | DELETE | - | - | Delete notification |
| *base_url*/trigger | POST | TriggerConfig | - | Trigger all notifications related to pipeline |


### NotificationWriteModel
Base model:
```
{
  "pipelineId": number,
  "condition": string,
  "type": "WEBHOOK" | "SLACK" | "FCM",
  "parameter": {
    ... see below
  }
}
```

Parameter for a webhook notification: 
```
"parameter": {
    "url": string
}
```


Parameter for a slack notification: 
```
"parameter": {
    "workspaceId": string
    "channelId": string
    "secret": string
}
```


Parameter for a firebase notification: 
```
"parameter": {
    "projectId": string
    "clientEmail": string
    "privateKey": string
    "topic": string
}
```

### NotificationReadModel
Equal to `NotificationWriteModel`, but has an additional `id: number` field.

### TriggerConfig
```
{
  "pipelineId": number,
  "pipelineName": string,
  "data": object
}
```


### Slack notification walkthrough
* Create a slack app for your slack channel and enable activations as discribed [here](https://api.slack.com/messaging/webhooks).
* Determine your apps' incoming webhook url at the slack [dashboard](https://api.slack.com/apps).
* POST a slackRequest under the endpoint ```/configs```. The workspaceId, channelId and secret fields can be taken from the parts of the incoming webhook url (separated by '/', in the given order).
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
