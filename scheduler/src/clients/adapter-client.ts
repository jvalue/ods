import axios, { AxiosResponse } from 'axios'

import { default as CorePipelineConfig } from '../interfaces/core/pipeline-config'
import { default as AdapterConfig } from '../interfaces/adapter/adapter-config'

const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'
const ADAPTER_SERVICE_IMPORT_URL = ADAPTER_SERVICE_URL + '/dataImport'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_IMPORT_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeAdapter (pipelineConfig: CorePipelineConfig): Promise<AxiosResponse> {

  const adapterConig: AdapterConfig = {
    protocol: {
      type: pipelineConfig.adapter.protocol,
      parameters: {
        location: pipelineConfig.adapter.location,
      }
    },
    format: {
      type: pipelineConfig.adapter.format
    }
  }

  const response = await http.post('/', adapterConig)
  return response.data
}
