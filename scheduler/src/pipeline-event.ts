export default interface PipelineEvent {
  eventId: number;
  pipelineId: number;
  eventType: EventType;
}

export enum EventType {
  PIPELINE_CREATE,
  PIPELINE_UPDATE,
  PIPELINE_DELETE
}
