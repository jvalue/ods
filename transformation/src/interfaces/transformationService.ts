import { NotificationRequest } from './notificationRequest'
import JobResult from './jobResult'

export default interface TransformationService {
  getVersion(): string;
  executeJob(code: string, data: object): JobResult;
  handleNotification(notificationRequest: NotificationRequest): Promise<void>;
}
