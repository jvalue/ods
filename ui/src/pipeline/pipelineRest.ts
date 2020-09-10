import axios, { AxiosResponse } from 'axios'
import Pipeline from './pipeline'
import { TRANSFORMATION_SERVICE_URL } from '@/env'

/**
 * Axios instances with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const httpPipelineConfigs = axios.create({
  baseURL: `${TRANSFORMATION_SERVICE_URL}/configs`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

export async function getAllPipelines (): Promise<Pipeline[]> {
  const response = await httpPipelineConfigs.get('/')
  return JSON.parse(response.data)
}

export async function getPipelineById (id: number): Promise<Pipeline> {
  const response = await httpPipelineConfigs.get(`/${id}`)
  return JSON.parse(response.data)
}

export async function getPipelineByDatasourceId (datasourceId: number): Promise<Pipeline> {
  const response = await httpPipelineConfigs.get(`?datasourceId=${datasourceId}`)
  return JSON.parse(response.data)
}

export async function createPipeline (pipeline: Pipeline): Promise<Pipeline> {
  console.log('send createPipeline' + pipeline.toString())
  console.log('stringified pipeline' + JSON.stringify(pipeline).toString())
  const response = await httpPipelineConfigs.post('/', JSON.stringify(pipeline))
  delete pipeline.id
  return JSON.parse(response.data)
}

export async function updatePipeline (pipeline: Pipeline): Promise<AxiosResponse> {
  return httpPipelineConfigs.put(`/${pipeline.id}`, JSON.stringify(pipeline))
}
export async function deletePipeline (id: number): Promise<AxiosResponse> {
  return httpPipelineConfigs.delete(`/${id}`)
}
