export default interface APIConfig {
  id: number;
  pipelineId: number;
  displayName: string;
  defaultAPI: boolean;
  remoteSchemata: RemoteSchemaData[];
}

export interface RemoteSchemaData {
  id: number;
  endpoint: string;
  author: string;
}
