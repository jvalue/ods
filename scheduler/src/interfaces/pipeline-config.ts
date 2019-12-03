import TriggerConfig from './trigger-config'
import Metadata from './metadata'
import AdapterConfig from './adapter-config'
import NotificationConfig from './notification-config'

export default interface PipelineConfig {
  id: number;

  adapter: AdapterConfig;
  transformations: object[];
  persistence: object;
  metadata: Metadata;
  trigger: TriggerConfig;
  notifications: NotificationConfig[];
}
