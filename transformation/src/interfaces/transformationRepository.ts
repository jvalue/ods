import { TransformationConfig } from "../models/TransormationConfig";
import { Connection, DeleteResult, UpdateResult } from 'typeorm';

export interface TransformationRepository {
  init(retries: number, backoff: number):void

  updateConfigForPipelineID(pipelineId: number, config: TransformationConfig): Promise<UpdateResult>
  deleteConfigsForPipelineID(pipelineId: number): Promise<DeleteResult>
  getTransformationConfigs(pipelineID: number): Promise<TransformationConfig[] | null>

  saveTransformationConfig(transformationConfig: TransformationConfig): Promise<TransformationConfig>
  deleteTransformationConfig(id: number): Promise<DeleteResult>
  updateTransoformationConfig(id: number, transformationConfig: TransformationConfig): Promise<UpdateResult>
  
}
