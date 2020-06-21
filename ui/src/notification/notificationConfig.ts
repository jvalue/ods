export enum CONFIG_TYPE {
  WEBHOOK = "webhook",
  SLACK = "slack",
  FCM = "fcm"
}

export default interface NotificationConfig {
  id: number;
  pipelineId: number;
  condition: string;
  type: string;
}

export interface WebhookNotification extends NotificationConfig {
  type: CONFIG_TYPE.WEBHOOK;
  url: string;
}

export interface SlackNotification extends NotificationConfig {
  type: CONFIG_TYPE.SLACK;
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface FirebaseNotification extends NotificationConfig {
  type: CONFIG_TYPE;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}
