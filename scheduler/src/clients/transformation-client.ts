import axios, { AxiosResponse } from 'axios'
import TransformationConfig from '@/interfaces/transformation-config'
import PipelineConfig from '@/interfaces/pipeline-config'


const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeTransformation (config: TransformationConfig): Promise<AxiosResponse> {
  const response = await http.post('/job', config)
  return response.data
}

/**
 * Temorary function to get pipeline configs from transformation service
 * (until message queue is implemented)
 * @param datasourceId datasourceId to get pipeline configs for
 */
export async function getPipelineConfigs(datasourceId: number): Promise<PipelineConfig[]>{
  const params = {datasourceId: datasourceId}
  const response = await http.get('/config',{ params })
  return response.data as PipelineConfig[]
}
