import axios, { AxiosResponse } from 'axios'
import Pipeline from './pipeline'

const CORE_SERVICE_URL = process.env.VUE_APP_CORE_SERVICE_URL as string
const NOTIFICATION_SERVICE_URL = process.env.VUE_APP_CORE_SERVICE_URL as string
const TRANSFORMATION_SERVICE_URL = process.env.VUE_APP_CORE_SERVICE_URL as string
/**
 * Axios instances with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http_core = axios.create({
  baseURL: `${CORE_SERVICE_URL}/pipelines`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

const http_notification = axios.create({
  baseURL: `${NOTIFICATION_SERVICE_URL}/config/pipelines`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

const http_transformation = axios.create({
  baseURL: `${TRANSFORMATION_SERVICE_URL}/config`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

export async function getAllPipelines (): Promise<Pipeline[]> {
  const response = await http_core.get('/')
  return JSON.parse(response.data)
}

export async function getPipelineById (id: number): Promise<Pipeline> {
  const response = await http_core.get(`/${id}`)
  return JSON.parse(response.data)
}

export async function getPipelineByDatasourceId (datasourceId: number): Promise<Pipeline> {
  const response = await http_core.get(`?datasourceId=${datasourceId}`)
  return JSON.parse(response.data)
}

export async function createPipeline (pipeline: Pipeline): Promise<Pipeline> {
  const response = await http_core.post('/', JSON.stringify(pipeline))
  return JSON.parse(response.data)
}

export async function updatePipeline (pipeline: Pipeline): Promise<AxiosResponse> {
  return http_core.put(`/${pipeline.id}`, JSON.stringify(pipeline))
}

export async function deletePipeline(id: number): Promise<AxiosResponse> {
  let response : AxiosResponse
  response = await http_notification.delete(`/${id}`)
  
  if (response.status == 200) {
    response = await http_transformation.delete(`/${id}`)
  }

  response = await http_core.delete(`/${id}`)
  return response
}
