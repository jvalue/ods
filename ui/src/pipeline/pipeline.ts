import NotificationConfig from '@/pipeline/notificationConfig'

export default interface Pipeline {
  id: number;
  adapter: object;
  metadata: PipelineMetaData;
  transformations: object[];
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
