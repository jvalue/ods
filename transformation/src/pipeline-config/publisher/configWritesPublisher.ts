export default interface ConfigWritesPublisher {
  publishCreation: (pipelineId: number, pipelineName: string) => boolean
  publishUpdate: (pipelineId: number, pipelineName: string) => boolean
  publishDeletion: (pipelineId: number, pipelineName: string) => boolean
}
