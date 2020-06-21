import axios, { AxiosResponse } from 'axios'
import NotificationConfig from '@/notification/notificationConfig'

const NOTIFICATION_SERVICE_URL = process.env.VUE_APP_NOTIFICATION_SERVICE_URL as string

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: `${NOTIFICATION_SERVICE_URL}`,
  headers: { 'Content-Type': 'application/json' },
  transformResponse: []
})

export async function getAllByPipelineId (pipelineId: number): Promise<NotificationConfig[]> {
  const response = await http.get(`/config/pipeline/${pipelineId}`)
  return JSON.parse(response.data)
}

export async function getById (id: number, notificationType: string): Promise<NotificationConfig> {
  const response = await http.get(`/config/${notificationType}/${id}`)
  return JSON.parse(response.data)
}

export async function create(notificationType: string, notificationConfig: NotificationConfig): Promise<NotificationConfig> {
  delete notificationConfig['id'] // remove notificaitonId
  const response = await http.post(`/config/${notificationType}`, JSON.stringify(notificationConfig))
  return JSON.parse(response.data)
}

export async function update(id: number, notificationType: string, notificationConfig: NotificationConfig): Promise<void> {
  delete notificationConfig['id'] // remove notificaitonId
  return http.put(`/config/${notificationType}/${id}`, JSON.stringify(notificationConfig))
}

export async function remove(id: number, notificationType: string): Promise<void> {
  return http.delete(`/config/${notificationType}/${id}`)
}
