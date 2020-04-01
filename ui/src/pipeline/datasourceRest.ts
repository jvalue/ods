import axios, { AxiosResponse } from 'axios'
import Datasource from './datasource'

const ADAPTER_SERVICE_URL = process.env.VUE_APP_ADAPTER_SERVICE_URL as string

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: `${ADAPTER_SERVICE_URL}/datasources`,
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

export async function getAllDatasources (): Promise<Datasource[]> {
  const response = await http.get('/')
  return JSON.parse(response.data, reviver)
}

export async function getDatasourceById (id: number): Promise<Datasource> {
  const response = await http.get(`/${id}`)
  return JSON.parse(response.data, reviver)
}

export async function createDatasource (datasource: Datasource): Promise<Datasource> {
  const response = await http.post('/', JSON.stringify(datasource))
  return JSON.parse(response.data, reviver)
}

export async function updateDatasource (datasource: Datasource): Promise<AxiosResponse> {
  return http.put(`/${datasource.id}`, JSON.stringify(datasource))
}

export async function deleteDatasource (id: number): Promise<AxiosResponse> {
  return http.delete(`/${id}`)
}
