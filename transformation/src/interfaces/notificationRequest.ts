export interface NotificationRequest {
  url: string;
  data: object;
  dataLocation: string;
  condition: string;
  notificationType: NotificationType;
}

export enum NotificationType {
  WEBHOOK = 'WEBHOOK'
}
