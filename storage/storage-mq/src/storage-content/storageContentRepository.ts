export interface StorageContentRepository {
  getAllContent: (
    tableIdentifier: string,
  ) => Promise<StorageContent[] | undefined>;
  getContent: (
    tableIdentifier: string,
    contentId: string,
  ) => Promise<StorageContent | undefined>;
  saveContent: (
    tableIdentifier: string,
    content: InsertStorageContent,
  ) => Promise<number>;
}

export interface StorageContent {
  id: number;
  pipelineId: number;
  timestamp: Date;
  data: unknown;
}

export interface InsertStorageContent {
  pipelineId: number;
  timestamp: Date;
  data: unknown;
}
