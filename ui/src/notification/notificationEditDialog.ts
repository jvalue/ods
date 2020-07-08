import NotificationConfig from '@/notification/notificationConfig'

export default interface NotificationEditDialog {

  openDialog(notificationConfig?: NotificationConfig): void;
  closeDialog(): void;
}
