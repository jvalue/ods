import TriggerConfig from './trigger-config'
import Metadata from './metadata'
import AdapterConfig from './adapter-config'
import NotificationConfig from './notification-config'
import TransformationConfig from './transformation-config'

export default interface PipelineConfig {
  id: number;

  adapter: AdapterConfig;
  transformation: TransformationConfig | undefined;
  persistence: object;
  metadata: Metadata;
  trigger: TriggerConfig;
  notifications: NotificationConfig[];
}
