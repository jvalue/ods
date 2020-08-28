import axios from 'axios'
import { StorageItem } from '@/storage/storage-item'
import { STORAGE_SERVICE_URL } from '@/env'

const http = axios.create({
  baseURL: STORAGE_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function getStoredItems (pipelineId: string): Promise<StorageItem[]> {
  const response = await http.get(`/${pipelineId}`)
  return response.data
}

export function createUrlForItem (pipelineId: string, itemId: string): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}?id=eq.${itemId}`
}

export function createUrlForLatestItem (pipelineId: string): string {
  return `${STORAGE_SERVICE_URL}/${pipelineId}?order=id.desc&limit=1`
}
