export default interface NotificationConfig {
  pipelineId?: number;
  pipelineName?: string;
  type: string;
  data: object;
  dataLocation: string;
}
