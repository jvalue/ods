import { NotificationConfig } from './notificationConfig'


export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifcationConfig: NotificationConfig, type: string): Promise<void>;
}
