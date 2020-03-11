import axios from 'axios'

import { default as AdapterConfig } from '../interfaces/adapter-config'
import AdapterResponse from '@/interfaces/adapter-response'

const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeAdapter (adapterConfig: AdapterConfig): Promise<AdapterResponse> {
  const response = await http.post('/dataImport', adapterConfig)
  return response.data
}

export async function fetchImportedData (dataBlobId: number): Promise<object> {
  const response = await http.get(`/data/${dataBlobId}`)
  return response.data
}
