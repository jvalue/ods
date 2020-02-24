export default interface NotificationConfig {
  notificationId: number;
  condition: string;
}

export interface WebhookNotification extends NotificationConfig{
  type: 'WEBHOOK';
  url: string;
}

export interface SlackNotification extends NotificationConfig{
  type: 'SLACK';
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface FirebaseNotification extends NotificationConfig{
  type: 'FCM';
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}
