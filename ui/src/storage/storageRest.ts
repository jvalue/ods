import axios from 'axios'
import { StorageItem, StorageItemMetaData } from '@/storage/storage-item'
import { STORAGE_SERVICE_URL } from '@/env'

const http = axios.create({
  baseURL: STORAGE_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function getStoredItems (pipelineId: string): Promise<StorageItemMetaData[]> {
  const response = await http.get(`/${pipelineId}?select=id,timestamp,pipelineId`)
  return response.data
}

export async function getStoredItem (pipelineId: string, storageItemId: string): Promise<StorageItem> {
  const response = await http.get(`/${pipelineId}?id=eq.${storageItemId}`)
  const item = response.data[0]
  return item
}

export function createUrlForItem (pipelineId: string, itemId: string): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}?id=eq.${itemId}`
}

export function createUrlForLatestItem (pipelineId: string): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}?order=id.desc&limit=1`
}
