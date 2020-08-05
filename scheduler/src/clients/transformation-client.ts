import axios from 'axios'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function triggerPipelines (datasourceId: number, dataLocation: string): Promise<void> {
  const trigger = {
    datasourceId: datasourceId,
    dataLocation: dataLocation
  }
  const response = await http.post('/trigger', trigger)
  if (response.status !== 200) {
    return Promise.reject(new Error(`Triggering pipelines failed with status ${response.status}`))
  }
  return Promise.resolve()
}
