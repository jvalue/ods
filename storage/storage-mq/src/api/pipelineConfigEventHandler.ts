import { StorageStructureRepository } from '../storage-structure/storageStructureRepository'

export class PipelineConfigEventHandler {
  constructor (private readonly structureRepository: StorageStructureRepository) {}

  async handleCreation (pipelineCreatedEvent: PipelineCreatedEvent): Promise<void> {
    await this.structureRepository.create(pipelineCreatedEvent.pipelineId.toString())
    await this.structureRepository.createForSchema(
      pipelineCreatedEvent.pipelineId.toString(),
      pipelineCreatedEvent.pipelineName,
      pipelineCreatedEvent.schema
    )
  }

  async handleDeletion (pipelineDeletedEvent: PipelineDeletedEvent): Promise<void> {
    await this.structureRepository.delete(pipelineDeletedEvent.pipelineId.toString())
  }
}

export interface PipelineCreatedEvent {
  pipelineId: number
  pipelineName: string
  schema: any
}

export interface PipelineDeletedEvent {
  pipelineId: number
  pipelineName: string
}
