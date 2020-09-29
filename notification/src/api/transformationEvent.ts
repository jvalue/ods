
/**
 * Event sent by the transformation service upon transformation finish
 */
export interface PipelineEvent {
  pipelineId: number
  pipelineName: string

  data?: object
  error?: object
}
