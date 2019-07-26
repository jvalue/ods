export default interface Pipeline {
  id: number;
  adapter: object;
  metadata: PipelineMetaData;
  transformations: object[];
  trigger: object;
}

export interface PipelineMetaData {
  displayName: string;
  description: string;
  author: string;
  license: string;
}
