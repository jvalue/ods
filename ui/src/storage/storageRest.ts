import axios from 'axios'
import { StorageItem, StorageItemMetaData } from '@/storage/storage-item'
import { STORAGE_SERVICE_URL } from '@/env'

const http = axios.create({
  baseURL: STORAGE_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function getStoredItems (pipelineId: number): Promise<StorageItemMetaData[]> {
  const response = await http.get(`/${pipelineId}?select=id,timestamp,pipelineId`)
  return response.data
}

export async function getStoredItem (pipelineId: number, storageItemId: number): Promise<StorageItem> {
  const response = await http.get(`/${pipelineId}?id=eq.${storageItemId}`)
  return response.data[0]
}

export function createUrlForItem (pipelineId: number, itemId: number): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}?id=eq.${itemId}`
}

export function createUrlForLatestItem (pipelineId: number): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}?order=id.desc&limit=1`
}
