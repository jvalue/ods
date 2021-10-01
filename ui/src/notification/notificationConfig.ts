export enum NotificationType {
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
  FCM = 'FCM',
}

export default interface NotificationConfig {
  id: number;
  pipelineId: number;
  condition: string;
  type: NotificationType;
  parameters: NotificationParameters | Record<string, unknown>; // Previously of type object, but object had to be replaced with Record<string, unknown> which is incompatible with interfaces
}

export interface WebhookNotification extends NotificationConfig {
  type: NotificationType.WEBHOOK;
  parameters: WebhookNotificationParameters;
}

export interface SlackNotification extends NotificationConfig {
  type: NotificationType.SLACK;
  parameters: SlackNotificationParameters;
}

export interface FirebaseNotification extends NotificationConfig {
  type: NotificationType.FCM;
  parameters: FirebaseNotificationParameters;
}

export type NotificationParameters =
  | WebhookNotificationParameters
  | SlackNotificationParameters
  | FirebaseNotificationParameters;

export interface WebhookNotificationParameters {
  url: string;
}

export interface SlackNotificationParameters {
  workspaceId: string;
  channelId: string;
  secret: string;
}

export interface FirebaseNotificationParameters {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}
