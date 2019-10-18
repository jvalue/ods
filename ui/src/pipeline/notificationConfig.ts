export default interface NotificationConfig {
  notificationId: number;
  notificationType: NotificationType;
  condition: string;
  url: string;
}

export enum NotificationType {
  WEBHOOK = 'WEBHOOK'
}
