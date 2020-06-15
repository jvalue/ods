import { NotificationConfig } from './notificationConfig'
import { TransformationEventInterface } from './transformationEventInterface';


export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifcationConfig: NotificationConfig, event: TransformationEventInterface, type: string): Promise<void>;
}
