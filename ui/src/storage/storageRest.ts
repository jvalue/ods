import axios from 'axios'
import { StorageItem } from '@/storage/storage-item'

const STORAGE_SERVICE_URL = process.env.VUE_APP_STORAGE_SERVICE_URL as string

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
