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
  type: 'webhook';
  url: string;
}

export interface SlackNotification extends NotificationConfig {
  type: "slack";
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface FirebaseNotification extends NotificationConfig {
  type: "fcm";
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}
