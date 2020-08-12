import { StorageContentRepository } from '../storage-content/storageContentRepository'

export default class PipelineExecutionEventHandler {
  contentRepository: StorageContentRepository

  constructor (contentRepository: StorageContentRepository) {
    this.contentRepository = contentRepository
  }

  async handleSuccess (pipelineExecutedEvent: PipelineExecutedEvent): Promise<void> {
    await this.contentRepository.saveContent(pipelineExecutedEvent.pipelineId, {
      pipelineId: pipelineExecutedEvent.pipelineId,
      timestamp: pipelineExecutedEvent.timestamp,
      data: pipelineExecutedEvent.data,
      id: undefined
    })
    return Promise.resolve()
  }
}

export interface PipelineExecutedEvent {
  pipelineId: string;
  timestamp: Date;
  data: object;
}
