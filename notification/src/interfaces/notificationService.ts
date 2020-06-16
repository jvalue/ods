import { NotificationConfig, CONFIG_TYPE } from '../models/notificationConfig'
import { TransformationEventInterface } from './transformationResults/transformationEventInterface';


export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifcationConfig: NotificationConfig, event: TransformationEventInterface, type: CONFIG_TYPE): Promise<void>;
}
