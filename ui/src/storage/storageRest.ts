import {StorageItem} from '@/storage/storage-item'

const STORAGE_SERVICE_URL = process.env.VUE_APP_STORAGE_SERVICE_URL as string

export async function getData (storageId: string): Promise<StorageItem[]> {
  const requestUrl = getUrl(storageId)
  return fetch(requestUrl, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    return response.json()
  })
}

export function getUrl(storageId: string): string {
  return `${STORAGE_SERVICE_URL}/${storageId}`
}

export function getItemUrl(storageId: string, itemId: string): string {
    return `${getUrl(storageId)}?id=eq.${itemId}`
}

export function getLatestItemUrl(storageId: string): string {
  return `${getUrl(storageId)}?order=id.desc&limit=1`
}
