import axios from 'axios'
import NotificationConfig from '@/notification/notificationConfig'
import { NOTIFICATION_SERVICE_URL } from '@/env'

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
  const notificationSummary: NotificationApiSummary = JSON.parse(response.data)
  const notifications: NotificationConfig[] = []
  for (const notification of notificationSummary.webhook) {
    notifications.push(fromApiModel(notification, 'webhook'))
  }
  for (const notification of notificationSummary.slack) {
    notifications.push(fromApiModel(notification, 'slack'))
  }
  for (const notification of notificationSummary.firebase) {
    notifications.push(fromApiModel(notification, 'fcm'))
  }
  return notifications
}

export async function getById (id: number, notificationType: string): Promise<NotificationConfig> {
  const response = await http.get(`/config/${notificationType}/${id}`)
  const notificationApiModel = JSON.parse(response.data)
  return fromApiModel(notificationApiModel, notificationType)
}

export async function create (notificationConfig: NotificationConfig): Promise<NotificationConfig> {
  const notificationType = notificationConfig.type

  const apiModel = toApiModel(notificationConfig)
  delete apiModel.id

  const response = await http.post(`/config/${notificationType}`, JSON.stringify(apiModel))
  const notificationApiModel = JSON.parse(response.data)
  return fromApiModel(notificationApiModel, notificationType)
}

export async function update (notificationConfig: NotificationConfig): Promise<void> {
  const notificationType = notificationConfig.type
  const id = notificationConfig.id

  const apiModel = toApiModel(notificationConfig)

  return await http.put(`/config/${notificationType}/${id}`, JSON.stringify(apiModel))
}

export async function remove (notificationConfig: NotificationConfig): Promise<void> {
  const notificationType = notificationConfig.type
  const id = notificationConfig.id

  return await http.delete(`/config/${notificationType}/${id}`)
}

interface NotificationApiSummary {
  webhook: WebhookNotificationApiConfig[]
  slack: SlackNotificationApiConfig[]
  firebase: FirebaseNotificationApiConfig[]
}

interface NotificationApiConfig {
  id: number
  pipelineId: number
  condition: string
}

interface WebhookNotificationApiConfig extends NotificationApiConfig {
  url: string
}

interface SlackNotificationApiConfig extends NotificationApiConfig {
  workspaceId: string
  channelId: string
  secret: string
}

interface FirebaseNotificationApiConfig extends NotificationApiConfig {
  projectId: string
  clientEmail: string
  privateKey: string
  topic: string
}

function toApiModel (notification: NotificationConfig): NotificationApiConfig {
  const baseApiNotification: NotificationApiConfig = {
    id: notification.id,
    pipelineId: notification.pipelineId,
    condition: notification.condition
  }
  const completeApiNotification = Object.assign(baseApiNotification, notification.parameters)
  return completeApiNotification
}

function fromApiModel (notificationApiModel: NotificationApiConfig, notificationType: string): NotificationConfig {
  return {
    id: notificationApiModel.id,
    pipelineId: notificationApiModel.pipelineId,
    condition: notificationApiModel.condition,
    type: notificationType,
    parameters: { ...notificationApiModel }
  }
}
