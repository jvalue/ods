export type StorageItem = StorageItemMetaData & {
  data: unknown;
};

export interface StorageItemMetaData {
  id: number;
  timestamp: string;
  pipelineId: number;
}
