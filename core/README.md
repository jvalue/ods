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

| Endpoint  | Method  | Request Body  | Response Body | Description |
|---|---|---|---|---|
| *base_url*/version  | GET  | -  | String containing the application version  | Get current service version |
| *base_url*/pipelines  | GET  | -  | Array of PipelineConfigs  | Get all saved pipelines |
| *base_url*/pipelines/${id}  | GET  | -  | PipelineConfig  | Get pipeline with id ${id} | 
| *base_url*/pipelines  | POST  | PipelineConfig | PipelineConfig | Create a new pipeline (id will be set by the core service) |
| *base_url*/pipelines/${id}  | PUT  | PipelineConfig | - | Update existing pipeline |
| *base_url*/pipelines/${id}  | DELETE  | - | - | Delete existing pipeline |
| *base_url*/pipelines/${id}/notifications  | POST  | NotificationConfig | NotificationConfig | Create notification for a pipeline |
| *base_url*/pipelines/${id}/notifications/${notificationId}  | DELETE  | - | - | Delete notification |
| *base_url*/pipelines  | DELETE  | - | - | Delete all pipelines |
| *base_url*/events  | GET  | -  | Array of PipelineEvents  | Get all events |
| *base_url*/events/${id}  | GET  | -  | PipelineEvent  | Get a event with id ${id} |
| *base_url*/events/pipeline/${id}  | GET  | -  | Array of PipelineEvents | Get all events that log modifications of pipeline with id ${id} |
| *base_url*/events/latest  | GET  | -  | PipelineEvent  | Get latest event |

### Pipeline Config
```
{ 
  "id": number,
  "datasourceId": number,
  "transformation": TransformationConfig,
  "notifications": [*NotificationConfig]
  "metadata":PipelineMetadata
}
```
### Pipeline Event
```
{
  "eventId": number,
  "eventType": "PIPELINE UPDATE" | "PIPELINE_CREATE" | "PIPELINE_DELETE",
  "pipelineId": number
}
```

### TransformationConfig
```
{
  "func":String,
  "data":String
}
```


### PipelineMetadata 
```
{
  "author":String,
  "displayName":String,
  "license":String,
  "description":String
}
```

### NotificationConfig
```
WebhookNotification | SlackNotification | FirebaseNotification
```

### WebhookParams
```
{
  "condition": String,
  "type": "WEBHOOK",
  "url": String (the url of the webhook you want to be triggered)
}
```

### SlackParams
```
{
  "condition": String,
  "type": "SLACK",
  "workspaceId": String (id of your slack workspace),
  "channelId": String (id of the channel where the notification is to be posted),
  "secret": String (secret part of the slack webhook, get it at slack management console)
}
```

### FirebaseParams
```
{
  "condition": String,
  "type": "FCM",
  "projectId": String (id of your firebase project),
  "clientEmail": String (email of the firebase service account),
  "privateKey: String (secret key associated with the service account),
  "topic": String (topic under which the notification is to be posted)
}
```
