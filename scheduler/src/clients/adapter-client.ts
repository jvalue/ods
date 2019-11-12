import axios, { AxiosResponse } from 'axios'

import PipelineConfig from '../interfaces/core/pipeline-config'

const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'
const ADAPTER_SERVICE_IMPORT_URL = ADAPTER_SERVICE_URL + '/dataImport'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_IMPORT_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeAdapter (pipelineConfig: PipelineConfig): Promise<AxiosResponse> {
  const response = await http.post('/', pipelineConfig.adapter)
  return response.data
}
