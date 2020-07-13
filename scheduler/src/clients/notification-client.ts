import axios, { AxiosResponse } from 'axios'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8084'

const http = axios.create({
  baseURL: NOTIFICATION_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' }
})

export async function executeNotification (triggerEvent: NotificationTriggerEvent): Promise<void> {
  const response = await http.post('trigger', triggerEvent)
  if (response.status !== 200 && response.status !== 204 && response.status !== 201) {
    return Promise.reject(new Error(`Error contacting notification-service: Got status ${response.status} for triggering notification on URL ${NOTIFICATION_SERVICE_URL}.`))
  }
}

export interface NotificationTriggerEvent {
  pipelineId: number;
  pipelineName: string;

  dataLocation: string; // url (location) of the queryable data

  data?: object;
  error?: object;
}
