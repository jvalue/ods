import NotificationConfig from './notification-config'

export default interface PipelineConfig {
  id: number;
  datasourceId: number;

  transformations: object[];
  persistence: object;
  metadata: PipelineMetadata;
  notifications: NotificationConfig[];
}

export interface PipelineMetadata {
  displayName: string;
  creationTimestamp: Date;
  license: string;
}
