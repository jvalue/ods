import axios from 'axios'

import type DatasourceConfig from '../interfaces/datasource-config'

import { ADAPTER_SERVICE_URL } from '../env'

const http = axios.create({
  baseURL: ADAPTER_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function getAllDatasources (): Promise<DatasourceConfig[]> {
  const response = await http.get('/datasources')
  return response.data
}

export async function triggerDatasource (datasourceId: number): Promise<void> {
  return await http.post(`/datasources/${datasourceId}/trigger`)
}
