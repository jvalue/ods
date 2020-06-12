import axios, { AxiosResponse } from 'axios'
import NotificationConfig from '@/notification/notificationConfig'

const NOTIFICATION_SERVICE_URL = process.env.VUE_APP_CORE_SERVICE_URL as string

/**
 * Axios instance with default headers and base url.
 * The option transformResponse is set to an empty array
 * because of explicit JSON.parser call with custom reviver.
 */
const http = axios.create({
  baseURL: `${NOTIFICATION_SERVICE_URL}`,
  headers: { 'Content-Type': 'application/json' },
})

export async function getAllByPipelineId (pipelineId: number): Promise<NotificationConfig[]> {
  const response = await http.get(`/pipelines/${pipelineId}/notifications`)
  return JSON.parse(response.data)
}

export async function getById (id: number): Promise<NotificationConfig> {
  const response = await http.get(`/notifications/${id}`)
  return JSON.parse(response.data)
}

export async function create (notificationConfig: NotificationConfig): Promise<NotificationConfig> {
  const notificationType = notificationConfig.type
  const requestBody = Object.assign({}, notificationConfig) as any
  requestBody.type = undefined

  const response = await http.post(`/notifications/${notificationType}`, JSON.stringify(requestBody))
  return JSON.parse(response.data)
}

export async function update (id: number, notificationConfig: NotificationConfig): Promise<void> {
  return http.put(`/notifications/${id}`, JSON.stringify(notificationConfig))
}

export async function remove (id: number): Promise<void> {
  return http.delete(`/notifications/${id}`)
}
