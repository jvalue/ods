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
  ): Promise<StorageItem | null> {
    const response = await this.http.get(
      `/${pipelineId}?id=eq.${storageItemId}`,
    );
    const responseData = response.data as StorageItem[];
    return responseData.length === 0 ? null : responseData[0];
  }

  createUrlForItem(pipelineId: number, itemId: number): string {
    return `${this.storageServiceUrl}/${pipelineId}?id=eq.${itemId}`;
  }

  createUrlForLatestItem(pipelineId: number): string {
    return `${this.storageServiceUrl}/${pipelineId}?order=id.desc&limit=1`;
  }
}
