export interface NotificationRequest {
  pipelineId: number;
  pipelineName: string;
  data: object;
  dataLocation: string;
  condition: string;
  type: string;
}

export interface Webhook extends NotificationRequest{
  url: string;
}

export interface Slack extends NotificationRequest {
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface Firebase extends NotificationRequest{
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}
