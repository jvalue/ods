export interface EventPublisher {
  publishCreation: (pipelineId: number, pipelineName: string) => boolean
  publishUpdate: (pipelineId: number, pipelineName: string) => boolean
  publishDeletion: (pipelineId: number, pipelineName: string) => boolean

  publishError: (pipelineId: number, pipelineName: string, error: string) => boolean
  publishSuccess: (pipelineId: number, pipelineName: string, result: unknown) => boolean
}
