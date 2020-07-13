import TransformationConfig from './transformation-config'

export default interface PipelineConfig {
  id: number;
  datasourceId: number;
  transformation: TransformationConfig | undefined;
  metadata: PipelineMetadata;
}

export interface PipelineMetadata {
  displayName: string;
  creationTimestamp: Date;
  license: string;
}
