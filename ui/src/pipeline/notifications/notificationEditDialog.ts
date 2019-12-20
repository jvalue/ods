import NotificationConfig from '@/pipeline/notifications/notificationConfig'

export default interface NotificationEditDialog {

  openDialog(notifcationConfig?: NotificationConfig): void;
  closeDialog(): void;
}
