import axios from 'axios'
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
  const notificationSummary: NotificationApiSummary = JSON.parse(response.data)
  const notifications: NotificationConfig[] = []
  for(const notification of notificationSummary.webhook) {
    notifications.push(fromApiModel(notification, "webhook"))
  }
  for(const notification of notificationSummary.slack) {
    notifications.push(fromApiModel(notification, "slack"))
  }
  for(const notification of notificationSummary.firebase) {
    notifications.push(fromApiModel(notification, "fcm"))
  }
  return notifications
}

export async function getById(id: number, notificationType: string): Promise<NotificationConfig> {
  const response = await http.get(`/config/${notificationType}/${id}`)
  const notificationApiModel = JSON.parse(response.data)
  return fromApiModel(notificationApiModel, notificationType)
}

export async function create(notificationConfig: NotificationConfig): Promise<NotificationConfig> {
  const notificationType = notificationConfig.type
  // remove notificationId and type
  delete notificationConfig['id']
  delete notificationConfig['type']

  const response = await http.post(`/config/${notificationType}`, JSON.stringify(notificationConfig))
  const notificationApiModel = JSON.parse(response.data)
  return fromApiModel(notificationApiModel, notificationType)
}

export async function update(notificationConfig: NotificationConfig): Promise<void> {
  const notificationType = notificationConfig.type
  const id = notificationConfig.id

  // remove notificationId and type
  delete notificationConfig['id']
  delete notificationConfig['type']

  return http.put(`/config/${notificationType}/${id}`, JSON.stringify(notificationConfig))
}

export async function remove(notificationConfig: NotificationConfig): Promise<void> {
  const notificationType = notificationConfig.type
  const id = notificationConfig.id

  return http.delete(`/config/${notificationType}/${id}`)
}

interface NotificationApiSummary {
  webhook: WebhookNotificationApiConfig[];
  slack: SlackNotificationApiConfig[];
  firebase: FirebaseNotificationApiConfig[];
}

interface NotificationApiConfig {
  id: number;
  pipelineId: number;
  condition: string;
}

interface WebhookNotificationApiConfig extends NotificationApiConfig {
  url: string;
}

interface SlackNotificationApiConfig extends NotificationApiConfig {
  workspaceId: string;
  channelId: string;
  secret: string;
}

interface FirebaseNotificationApiConfig extends NotificationApiConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}

function toApiModel(notification: NotificationConfig): NotificationApiConfig {
  const notificationAPIModel: any = Object.assign({}, notification)
  notificationAPIModel.type = undefined
  return notificationAPIModel as NotificationApiConfig
}

function fromApiModel(notificationApiModel: NotificationApiConfig, notificationType: string): NotificationConfig {
  const notification: any = Object.assign({}, notificationApiModel)
  notification.type = notificationType
  return notification as NotificationConfig
}
