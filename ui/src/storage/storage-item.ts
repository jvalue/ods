export type StorageItem = StorageItemMetaData & {
  data: Record<string, unknown>;
};

export interface StorageItemMetaData {
  id: number;
  timestamp: string;
  pipelineId: number;
}
