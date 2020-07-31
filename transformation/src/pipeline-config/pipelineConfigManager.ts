import PipelineExecutor from "../pipeline-execution/pipelineExecutor";
import { ExecutionResultPublisher } from "./executionResultPublisher";

export class PipelineConfigManager {

  pipelineExecutor: PipelineExecutor
  executionResultPublisher: ExecutionResultPublisher

  constructor(pipelineExecutor: PipelineExecutor, executionResultPublisher: ExecutionResultPublisher) {
    this.pipelineExecutor = pipelineExecutor
    this.executionResultPublisher = executionResultPublisher
  }



  triggerConfig(pipelineId: number, pipelineName: string, func: string, data: object) {
    const result = this.pipelineExecutor.executeJob(func, data)

    if(result.error) {
      this.executionResultPublisher.publishError(pipelineId, pipelineName, result.error.message)
    } else if(result.data) {
      this.executionResultPublisher.publishSuccess(pipelineId, pipelineName, result.data)
    } else {
      console.error(`Pipeline ${pipelineId} executed with ambiguous result: no data and no error!`)
    }
  }
}
