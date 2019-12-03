import NotificationConfig from '@/pipeline/notificationConfig'

export default interface Pipeline {
  id: number;
  adapter: AdapterConfig;
  metadata: PipelineMetaData;
  transformations: TransformationConfig[];
  trigger: Trigger;
  notifications: NotificationConfig[];
}

export interface PipelineMetaData {
  displayName: string;
  description: string;
  author: string;
  license: string;
}

export interface Trigger {
  periodic: boolean;
  interval: number;
  firstExecution: Date;
}

export interface AdapterConfig {
  format: {
    type: string;
    parameters: object;
  };
  protocol: {
    type: string;
    parameters: object;
  }
}

export interface TransformationConfig {
  func: string;
}
