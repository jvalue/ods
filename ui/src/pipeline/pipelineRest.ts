import axios, { AxiosResponse } from 'axios'
import Pipeline from './pipeline'

const CORE_SERVICE_URL = process.env.VUE_APP_CORE_SERVICE_URL as string

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: `${CORE_SERVICE_URL}/pipelines`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

/**
 * This reviver function replaces firstExecution attribute with a date object
 * if the current type is string.
 */
const reviver = (key: string, value: object): object => {
  if (key === 'firstExecution' && typeof value === 'string') {
    return new Date(value)
  }

  return value
}

export async function getAllPipelines (): Promise<Pipeline[]> {
  const response = await http.get('/')
  return JSON.parse(response.data, reviver)
}

export async function getPipelineById (id: number): Promise<Pipeline> {
  const response = await http.get(`/${id}`)
  return JSON.parse(response.data, reviver)
}

export async function createPipeline (pipeline: Pipeline): Promise<Pipeline> {
  const response = await http.post('/', JSON.stringify(pipeline))
  return JSON.parse(response.data, reviver)
}

export async function updatePipeline (pipeline: Pipeline): Promise<AxiosResponse> {
  return http.put(`/${pipeline.id}`, JSON.stringify(pipeline))
}

export async function deletePipeline (id: number): Promise<AxiosResponse> {
  return http.delete(`/${id}`)
}
