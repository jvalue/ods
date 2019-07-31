export default interface Pipeline {
  id: number;
  adapter: object;
  metadata: PipelineMetaData;
  transformations: object[];
  trigger: Trigger;
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