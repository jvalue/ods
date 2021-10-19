import axios, { AxiosInstance } from 'axios';

import { StorageItem, StorageItemMetaData } from '@/storage/storage-item';

export class StorageRest {
  private readonly http: AxiosInstance;

  constructor(private readonly storageServiceUrl: string) {
    this.http = axios.create({
      baseURL: storageServiceUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getStoredItems(pipelineId: number): Promise<StorageItemMetaData[]> {
    const response = await this.http.get(
      `/${pipelineId}?select=id,timestamp,pipelineId`,
    );
    return response.data as StorageItemMetaData[];
  }

  async getStoredItem(
    pipelineId: number,
    storageItemId: number,
  ): Promise<StorageItem | undefined> {
    const response = await this.http.get(
      `/${pipelineId}?id=eq.${storageItemId}`,
    );
    // Returns undefined in case the array is empty
    return (response.data as StorageItem[])[0];
  }

  createUrlForItem(pipelineId: number, itemId: number): string {
    return `${this.storageServiceUrl}/${pipelineId}?id=eq.${itemId}`;
  }

  createUrlForLatestItem(pipelineId: number): string {
    return `${this.storageServiceUrl}/${pipelineId}?order=id.desc&limit=1`;
  }
}
