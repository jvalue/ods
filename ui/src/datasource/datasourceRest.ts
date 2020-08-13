import axios, { AxiosResponse } from 'axios'
import Datasource, { Data } from './datasource'

const ADAPTER_SERVICE_URL = process.env.VUE_APP_ADAPTER_SERVICE_URL as string

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
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
  const response = await http.get('/datasources')
  return JSON.parse(response.data, reviver)
}

export async function getDatasourceById (id: number): Promise<Datasource> {
  const response = await http.get(`/datasources/${id}`)
  return JSON.parse(response.data, reviver)
}

export async function createDatasource (datasource: Datasource): Promise<Datasource> {
  const response = await http.post('/datasources', JSON.stringify(datasource))
  return JSON.parse(response.data, reviver)
}

export async function updateDatasource (datasource: Datasource): Promise<AxiosResponse> {
  return http.put(`/datasources/${datasource.id}`, JSON.stringify(datasource))
}

export async function deleteDatasource (id: number): Promise<AxiosResponse> {
  return http.delete(`/datasources/${id}`)
}

export async function getDatasourceData (id: number): Promise<any> {
  const importResponse = await http.post<string>(`/datasources/${id}/trigger`)
  const jsonResponse = JSON.parse(importResponse.data) as Data
  const location = jsonResponse.location
  const dataResponse = await http.get<string>(location)
  const data = JSON.parse(dataResponse.data)
  return data
}
