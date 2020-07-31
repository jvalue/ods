export default interface PipelineConfigTriggerRequest {
  pipelineId: number;
  pipelineName: string;

  func: string;
  data: object;
  dataLocation: string;
}
