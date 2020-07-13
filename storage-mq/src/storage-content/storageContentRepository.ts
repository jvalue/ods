import { StorageContent } from "./storageContent";

export interface StorageContentRepository {
  init(retries: number, backoff: number): Promise<void>

  getAllContent(tableIdentifier: string): Promise<StorageContent[]>
  getContent(tableIdentifier: string, contentId: string): Promise<StorageContent>
  saveContent(tableIdentifier: string, content: StorageContent): Promise<number>
}
