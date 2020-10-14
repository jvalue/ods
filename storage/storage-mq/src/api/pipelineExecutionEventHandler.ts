import { StorageContentRepository } from '../storage-content/storageContentRepository'

export default class PipelineExecutionEventHandler {
  contentRepository: StorageContentRepository

  constructor (contentRepository: StorageContentRepository) {
    this.contentRepository = contentRepository
  }

  async handleSuccess (pipelineExecutedEvent: PipelineExecutedEvent): Promise<void> {
    await this.contentRepository.saveContent(pipelineExecutedEvent.pipelineId.toString(), {
      pipelineId: pipelineExecutedEvent.pipelineId,
      timestamp: pipelineExecutedEvent.timestamp ?? new Date(),
      data: pipelineExecutedEvent.data
    })
  }
}

export interface PipelineExecutedEvent {
  pipelineId: number
  pipelineName: string
  data: unknown
  timestamp?: Date
}
