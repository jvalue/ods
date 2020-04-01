import NotificationConfig from './notification-config'
import TransformationConfig from './transformation-config'

export default interface PipelineConfig {
  id: number;
  datasourceId: number;
  transformation: TransformationConfig | undefined;
  persistence: object;
  metadata: PipelineMetadata;
  notifications: NotificationConfig[];
}

export interface PipelineMetadata {
  displayName: string;
  creationTimestamp: Date;
  license: string;
}
