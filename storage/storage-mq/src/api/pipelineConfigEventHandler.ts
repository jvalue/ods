import { StorageStructureRepository } from '../storage-structure/storageStructureRepository'

export class PipelineConfigEventHandler {
  constructor (private readonly structureRepository: StorageStructureRepository) {}

  async handleCreation (pipelineCreatedEvent: PipelineCreatedEvent): Promise<void> {
    await this.structureRepository.create(pipelineCreatedEvent.pipelineId.toString())
    if (pipelineCreatedEvent.schema !== undefined && pipelineCreatedEvent.schema !== null) {
      await this.structureRepository.createForSchema(
        pipelineCreatedEvent.schema as object,
        pipelineCreatedEvent.pipelineName + pipelineCreatedEvent.pipelineId.toString()
      )
    }
  }

  async handleDeletion (pipelineDeletedEvent: PipelineDeletedEvent): Promise<void> {
    await this.structureRepository.delete(pipelineDeletedEvent.pipelineId.toString())
  }
}

export interface PipelineCreatedEvent {
  pipelineId: number
  pipelineName: string
  schema?: any
}

export interface PipelineDeletedEvent {
  pipelineId: number
  pipelineName: string
}
