import { StorageContentRepository } from "@/storage-content/storageContentRepository"

export default class PipelineExecutionEventHandler {
  contentRepository: StorageContentRepository

  constructor(contentRepository: StorageContentRepository) {
    this.contentRepository = contentRepository
  }


  async handleSuccess(pipelineExecutedEvent: PipelineExecutedEvent): Promise<void> {
    await this.contentRepository.saveContent(pipelineExecutedEvent.pipelineId, {
      pipelineId: pipelineExecutedEvent.pipelineId,
      origin: pipelineExecutedEvent.origin,
      license: pipelineExecutedEvent.license,
      timestamp: pipelineExecutedEvent.timestamp,
      data: pipelineExecutedEvent.data,
      id: -1
    })
    return Promise.resolve()
  }
}

export interface PipelineExecutedEvent {
  pipelineId: string

  timestamp: Date
  origin: string
  license: string

  data: object
}
