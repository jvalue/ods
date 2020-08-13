import axios from 'axios'

import DatasourceConfig from '../interfaces/datasource-config'
import DatasourceEvent from '@/interfaces/datasource-event'

export const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL || 'http://localhost:8082'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function getAllDatasources (): Promise<DatasourceConfig[]> {
  const response = await http.get('/datasources')
  return response.data
}

export async function getDatasource (datasourceId: number): Promise<DatasourceConfig> {
  const response = await http.get(`datasources/${datasourceId}`)
  return response.data
}

export async function getEventsAfter (eventId: number): Promise<DatasourceEvent[]> {
  const response = await http.get(`datasources/events?after=${eventId}`)
  return response.data
}

export async function getLatestEventId (): Promise<number> {
  const response = await http.get('datasources/events/latest')
  return response.data.eventId || 0
}

export async function triggerDatasource (datasourceId: number): Promise<void> {
  return await http.post(`/datasources/${datasourceId}/trigger`)
}
