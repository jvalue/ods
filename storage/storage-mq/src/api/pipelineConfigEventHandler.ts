import { StorageStructureRepository } from '../storage-structure/storageStructureRepository'

export default class PipelineConfigEventHandler {
  structureRepository: StorageStructureRepository

  constructor (structureRepository: StorageStructureRepository) {
    this.structureRepository = structureRepository
  }

  handleCreation (pipelineCreatedEvent: PipelineCreatedEvent): Promise<void> {
    return this.structureRepository.create(pipelineCreatedEvent.pipelineId)
  }

  handleDeletion (pipelineDeletedEvent: PipelineDeletedEvent): Promise<void> {
    return this.structureRepository.delete(pipelineDeletedEvent.pipelineId)
  }
}

export interface PipelineCreatedEvent {
  pipelineId: string
}

export interface PipelineDeletedEvent {
  pipelineId: string
}
