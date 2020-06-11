import axios, { AxiosResponse } from 'axios'
import NotificationConfig from '@/interfaces/notification-config'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8084'

const http = axios.create({
  baseURL: NOTIFICATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})


export async function executeNotification (notificationConfig: NotificationConfig): Promise<void> {
  const response = await http.post(`${notificationConfig.type}`, notificationConfig)
  if (response.status !== 200 && response.status !== 204) {
    return Promise.reject(new Error(`Error contacting notification-service: Got status ${response.status} for triggering notification on URL ${NOTIFICATION_SERVICE_URL}.`))
  }
}
