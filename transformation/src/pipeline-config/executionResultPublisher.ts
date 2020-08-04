export interface ExecutionResultPublisher {
  publishError(pipelineId: number, pipelineName: string, error: string): boolean
  publishSuccess(pipelineId: number, pipelineName: string, result: object): boolean
}
