import { NotificationConfig, CONFIG_TYPE } from '../models/notificationConfig'
import { TransformationEvent } from './transformationResults/transformationEvent';


export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifcationConfig: NotificationConfig, event: TransformationEvent, type: CONFIG_TYPE): Promise<void>;
}
