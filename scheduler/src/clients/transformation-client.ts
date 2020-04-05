import axios, { AxiosResponse } from 'axios'
import NotificationConfig from '@/interfaces/notification-config'
import TransformationConfig from '@/interfaces/transformation-config'

const TRANSFORMATION_SERVICE_URL = process.env.TRANSFORMATION_SERVICE_URL || 'http://localhost:8083'
const ADAPTER_SERVICE_URL = process.env.ADAPTER_SERVICE_URL

const http = axios.create({
  baseURL: TRANSFORMATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeTransformation (config: TransformationConfig, location: string): Promise<AxiosResponse> {
  config.dataLocation = `${ADAPTER_SERVICE_URL}${location}`
  const response = await http.post('/job', config)
  return response.data
}

export async function executeNotification (notificationConfig: NotificationConfig): Promise<void> {
  const response = await http.post(`notification/${notificationConfig.type}`, notificationConfig)
  if (response.status !== 200 && response.status !== 204) {
    return Promise.reject(new Error('Error contacting transformation-service'))
  }
}
