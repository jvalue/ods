import NotificationConfig, { NotificationType } from '@/pipeline/notificationConfig'

export default interface NotificationEditDialog {

  openDialog(notifcationConfig?: NotificationConfig): void;
  closeDialog(): void;
}
