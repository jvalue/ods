import { JsonSchemaElementBase, isDefined } from '../service/sharedHelper';
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
    if (isDefined(pipelineCreatedEvent.schema)) {
      await this.structureRepository.createForSchema(
        pipelineCreatedEvent.schema,
        pipelineCreatedEvent.pipelineName +
          pipelineCreatedEvent.pipelineId.toString(),
      );
    }
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
  schema?: JsonSchemaElementBase;
}

export interface PipelineDeletedEvent {
  pipelineId: number;
  pipelineName: string;
}
