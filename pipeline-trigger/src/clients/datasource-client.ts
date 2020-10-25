import axios from 'axios'

import { ADAPTER_API } from '../env'

const http = axios.create({
  baseURL: ADAPTER_API,
  headers: { 'Content-Type': 'application/json' }
})

export async function triggerDatasource (datasourceId: number, runtimeParameters: object): Promise<void> {
  try {
    await http.post(`/datasources/${datasourceId}/trigger`, runtimeParameters)
  } catch (e: unknown) {
    console.log(`Triggering datasource failed. Reason ${JSON.stringify(e)}`)
    throw e
  }
}
