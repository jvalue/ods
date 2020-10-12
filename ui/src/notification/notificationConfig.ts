export enum CONFIG_TYPE {
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  FCM = 'fcm'
}

export default interface NotificationConfig {
  id: number
  pipelineId: number
  condition: string
  type: string
  parameters: object
}

export interface WebhookNotification extends NotificationConfig {
  type: 'webhook'
  parameters: WebhookNotificationParameters
}

export interface SlackNotification extends NotificationConfig {
  type: 'slack'
  parameters: SlackNotificationParameters
}

export interface FirebaseNotification extends NotificationConfig {
  type: 'fcm'
  parameters: FirebaseNotificationParameters
}

export interface WebhookNotificationParameters {
  url: string
}

export interface SlackNotificationParameters {
  workspaceId: string
  channelId: string
  secret: string
}

export interface FirebaseNotificationParameters {
  projectId: string
  clientEmail: string
  privateKey: string
  topic: string
}
