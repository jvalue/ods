import axios, { AxiosResponse } from 'axios'

import { default as AdapterConfig } from '../interfaces/adapter-config'

const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'
const ADAPTER_SERVICE_IMPORT_URL = ADAPTER_SERVICE_URL + '/dataImport'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_IMPORT_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeAdapter (adapterConfig: AdapterConfig): Promise<AxiosResponse> {

  const response = await http.post('/', adapterConfig)
  return response.data
}
