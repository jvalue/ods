import axios, { AxiosResponse } from 'axios'
import APIConfig from './api'
import { APP_CONFIGURATION_SERVICE_URL } from '@/env'

/**
 * Axios instances with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const httpAPIConfigs = axios.create({
  baseURL: `${APP_CONFIGURATION_SERVICE_URL}/apiconfig`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

export async function getAllAPIConfigs (): Promise<APIConfig[]> {
  console.log('-----send getAllAPIConfigs')
  const response = await httpAPIConfigs.get('/all')
  return JSON.parse(response.data)
}

export async function getAPIConfigById (id: number): Promise<APIConfig> {
  console.log('-----send getAPIConfigById' + id)
  const response = await httpAPIConfigs.get(`/${id}`)
  return JSON.parse(response.data)
}

export async function getAPIConfigByPipelineId (pipelineId: number): Promise<APIConfig> {
  console.log('-----send getAPIConfigByPipelineId' + pipelineId)
  const response = await httpAPIConfigs.get(`/pipeline/?pipelineId=${pipelineId}`)
  return JSON.parse(response.data)
}

export async function createAPIConfig (apiConfig: APIConfig): Promise<APIConfig> {
  console.log('-----send createAPIConfig' + JSON.stringify(apiConfig))
  const response = await httpAPIConfigs.post('', JSON.stringify(apiConfig))
  delete apiConfig.id
  return JSON.parse(response.data)
}

export async function updateAPIConfig (apiConfig: APIConfig): Promise<AxiosResponse> {
  console.log('-----send updateAPIConfig' + JSON.stringify(apiConfig))
  return httpAPIConfigs.put(`/${apiConfig.id}`, JSON.stringify(apiConfig))
}
export async function deleteAPIConfig (id: number): Promise<AxiosResponse> {
  console.log('-----send deleteAPIConfig' + id)
  return httpAPIConfigs.delete(`/${id}`)
}
