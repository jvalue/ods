import NotificationConfig from '@/pipeline/notifications/notificationConfig'

export default interface Pipeline {
  id: number;
  datasourceId: number;
  metadata: PipelineMetaData;
  transformation: TransformationConfig;
  notifications: NotificationConfig[];
}

export interface PipelineMetaData {
  displayName: string;
  description: string;
  author: string;
  license: string;
}

export interface TransformationConfig {
  func: string;
}
