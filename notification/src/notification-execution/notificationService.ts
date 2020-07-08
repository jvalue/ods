import { NotificationConfig, CONFIG_TYPE } from '../notification-config/notificationConfig'
import { TransformationEvent } from './condition-evaluation/transformationEvent';


export default interface NotificationService {
  getVersion(): string;
  handleNotification(notifcationConfig: NotificationConfig, event: TransformationEvent, type: CONFIG_TYPE): Promise<void>;
}
