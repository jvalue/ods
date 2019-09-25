export interface NotificationRequest {
  callbackUrl: string;
  data: object;
  dataLocation: string;
  condition: string;
  type: NotificationType;
}

export enum NotificationType {
  WEBHOOK = 'WEBHOOK'
}
