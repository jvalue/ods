import axios from 'axios'
import { ADAPTER_SERVICE_URL } from '@/env'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

export interface PreviewConfig {
  protocol: {
    type: string
    parameters: object
  }
  format: {
    type: string
    parameters: object
  }
}

export type PreviewData = object

export async function getPreview (config: PreviewConfig): Promise<PreviewData> {
  const importResponse = await http.post<string>('/preview', config)
  const body = JSON.parse(importResponse.data)
  return JSON.parse(body.data)
}
