import { TransformationConfig } from "../models/TransformationConfig";
import { Connection, DeleteResult, UpdateResult } from 'typeorm';
import { Query } from "typeorm/driver/Query";

export interface TransformationRepository {
  init(retries: number, backoff: number):void

  updateConfigForPipelineID(pipelineId: number, config: TransformationConfig): Promise<UpdateResult>
  deleteConfigsForPipelineID(pipelineId: number): Promise<DeleteResult>
  getTransformationConfig(pipelineID: number, query: Query): Promise<TransformationConfig | null |undefined>

  saveTransformationConfig(transformationConfig: TransformationConfig): Promise<TransformationConfig>
  deleteTransformationConfig(id: number): Promise<DeleteResult>
  updateTransformationConfig(id: number, transformationConfig: TransformationConfig): Promise<UpdateResult>

}
