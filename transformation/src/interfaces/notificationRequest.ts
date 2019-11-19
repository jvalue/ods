export interface NotificationRequest {
  pipelineId: number,
  pipelineName: string;
  url: string;
  data: object;
  dataLocation: string;
  condition: string;
  notificationType: NotificationType;
}

export enum NotificationType {
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
  FCM = 'FCM'
}
