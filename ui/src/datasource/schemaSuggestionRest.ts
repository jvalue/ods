import axios from 'axios'
import { DataSchema } from './datasource'
import { SCHEMA_SERVICE_URL } from '@/env'

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const httpSchema = axios.create({
  baseURL: SCHEMA_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  maxContentLength: 100000000,
  maxBodyLength: 1000000000,
  transformResponse: []
})

export async function getIsAlive (): Promise<string> {
  const response = await httpSchema.get<string>('/check')
  return response.data
}

export async function getSchema (dataSchema: DataSchema, precision: string): Promise<string> {
  const response = await httpSchema.post<string>('/suggestion', { data: dataSchema.data, precision: precision })
  return response.data
}
