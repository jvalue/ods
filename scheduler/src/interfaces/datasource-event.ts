export interface DatasourceEvent {
  eventId: number
  datasourceId: number
  eventType: EventType
}

export enum EventType {
  DATASOURCE_CREATE = 'DATASOURCE_CREATE',
  DATASOURCE_UPDATE = 'DATASOURCE_UPDATE',
  DATASOURCE_DELETE = 'DATASOURCE_DELETE'
}
