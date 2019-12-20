import NotificationConfig from '@/pipeline/notifications/notificationConfig'

export default interface NotificationEditDialog {

  openDialog(notificationConfig?: NotificationConfig): void;
  closeDialog(): void;
}
