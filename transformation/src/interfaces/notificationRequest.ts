export interface NotificationRequest {
  pipelineId: number;
  pipelineName: string;
  data: object;
  dataLocation: string;
  condition: string;
  params: WebhookParams | SlackParams | FirebaseParams
}

export interface WebhookParams {
  type: 'WEBHOOK';
  url: string;
}

export interface SlackParams {
  type: 'SLACK';
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface FirebaseParams {
  type: 'FCM',
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string
}

