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
  transformResponse: []
})

export async function getIsAlive (): Promise<string> {
  const response = await httpSchema.get<string>('/check')
  return response.data
}

export async function getSchemaFast (dataSchema: DataSchema): Promise<string> {
  const response = await httpSchema.post<string>('/suggestion/fast', dataSchema.data)
  return response.data
}

export async function getSchemaDetailed (dataSchema: DataSchema): Promise<string> {
  const response = await httpSchema.post<string>('/suggestion/detailed', dataSchema.data)
  return response.data
}
