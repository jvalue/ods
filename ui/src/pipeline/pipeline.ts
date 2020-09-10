export default interface Pipeline {
  id: number;
  datasourceId: number;
  metadata: PipelineMetaData;
  transformation: TransformationConfig;
  defaultAPI: boolean;
  remoteSchemata: RemoteSchemaData[];
}

export interface PipelineMetaData {
  displayName: string;
  description: string;
  author: string;
  license: string;
}

export interface RemoteSchemaData {
  id: number;
  endpoint: string;
  author: string;
}

export interface TransformationConfig {
  func: string;
}
