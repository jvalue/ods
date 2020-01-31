import { NotificationRequest_v1 } from './notificationRequest_v1'
import JobResult from './jobResult'
import { NotificationRequest } from '../interfaces/notificationRequest'

export default interface TransformationService {
  getVersion(): string;
  executeJob(code: string, data: object): JobResult;
  handleNotificationv1(notificationRequest: NotificationRequest_v1): Promise<void>;
  handleNotification(notifiactionRequest: NotificationRequest): Promise<void>;
}
