import { PipelineConfigDTO } from './../model/pipelineConfig'

export default interface ConfigWritesPublisher {
  publishCreation(pipelineId: number, pipelineConfig: PipelineConfigDTO): boolean;
  publishUpdate(pipelineId: number, pipelineConfig: PipelineConfigDTO): boolean;
  publishDeletion(pipelineId: number, pipelineName: string): boolean;
}
