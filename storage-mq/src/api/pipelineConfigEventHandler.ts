export default class PipelineConfigEventHandler {
  handleCreation(pipelineCreatedEvent: PipelineCreatedEvent): Promise<void> {
    return Promise.reject("Not implemented yet")
  }
  handleDeletion(pipelineDeletedEvent: PipelineDeletedEvent): Promise<void> {
    return Promise.reject("Not implemented yet")
  }
}

export interface PipelineCreatedEvent {
  pipelineId: string
}

export interface PipelineDeletedEvent {
  pipelineId: string
}
