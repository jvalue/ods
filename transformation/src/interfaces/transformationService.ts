import { NotificationRequest_v1 } from './notificationRequest_v1'
import JobResult from './jobResult'

export default interface TransformationService {
  getVersion(): string;
  executeJob(code: string, data: object): JobResult;
  handleNotification(notificationRequest: NotificationRequest_v1): Promise<void>;
}
