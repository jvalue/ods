import { StorageStructureRepository } from '../storage-structure/storageStructureRepository'

export default class PipelineConfigEventHandler {
  structureRepository: StorageStructureRepository

  constructor (structureRepository: StorageStructureRepository) {
    this.structureRepository = structureRepository
  }

  async handleCreation (pipelineCreatedEvent: PipelineCreatedEvent): Promise<void> {
    await this.structureRepository.create(pipelineCreatedEvent.pipelineId.toString())
  }

  async handleDeletion (pipelineDeletedEvent: PipelineDeletedEvent): Promise<void> {
    await this.structureRepository.delete(pipelineDeletedEvent.pipelineId.toString())
  }
}

export interface PipelineCreatedEvent {
  pipelineId: number
  pipelineName: string
}

export interface PipelineDeletedEvent {
  pipelineId: number
  pipelineName: string
}
