import { NotificationRequest } from './notificationRequest'

export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifiactionRequest: NotificationRequest): Promise<void>;
}
