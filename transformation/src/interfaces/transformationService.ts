import JobResult from './jobResult'
import { NotificationRequest } from '../interfaces/notificationRequest'

export default interface TransformationService {
  getVersion(): string;
  executeJob(code: string, data: object): JobResult;
  handleNotification(notifiactionRequest: NotificationRequest): Promise<void>;
}
