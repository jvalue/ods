export type StorageItem = StorageItemMetaData & {
  data: object;
}

export interface StorageItemMetaData {
  id: number;
  timestamp: string;
  pipelineId: string;
}
