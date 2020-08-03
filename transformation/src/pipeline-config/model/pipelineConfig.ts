export default interface PipelineConfig {
  id: number;
  datasourceId: number;
  transformation: TransformationConfig;
  metadata: Metadata
}

export interface TransformationConfig {
  func: string;
}

export interface Metadata {
  author: string;
  displayName: string;
  license: string;
  description: string;
  creationTimestamp: Date;
}
