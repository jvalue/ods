import { PipelineConfig } from "../models/PipelineConfig";
import { Connection, DeleteResult, UpdateResult } from 'typeorm';
import { Query } from "typeorm/driver/Query";

export interface PipelineRepository {
  init(retries: number, backoff: number):void

  getPipelineConfig(pipelineID: number, query: Query): Promise<PipelineConfig | null |undefined>

  savePipelineConfig(pipelineConfig: PipelineConfig): Promise<PipelineConfig>
  deletePipelineConfig(id: number): Promise<DeleteResult>
  updatePipelineConfig(id: number, pipelineConfig: PipelineConfig): Promise<PipelineConfig>

}
