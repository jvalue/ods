import { StorageStructureRepository } from '../storage-structure/storageStructureRepository';

export class PipelineConfigEventHandler {
  constructor(
    private readonly structureRepository: StorageStructureRepository,
  ) {}

  async handleCreation(
    pipelineCreatedEvent: PipelineCreatedEvent,
  ): Promise<void> {
    await this.structureRepository.create(
      pipelineCreatedEvent.pipelineId.toString(),
    );
  }

  async handleDeletion(
    pipelineDeletedEvent: PipelineDeletedEvent,
  ): Promise<void> {
    await this.structureRepository.delete(
      pipelineDeletedEvent.pipelineId.toString(),
    );
  }
}

export interface PipelineCreatedEvent {
  pipelineId: number;
  pipelineName: string;
}

export interface PipelineDeletedEvent {
  pipelineId: number;
  pipelineName: string;
}
