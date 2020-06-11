import { NotificationConfigRequest } from './notificationConfig'

export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifiactionRequest: NotificationConfigRequest): Promise<void>;
}
