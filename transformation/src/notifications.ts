import axios from 'axios'
import WebhookCallback from './interfaces/webhookCallback'
import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'
import { evaluate } from './sandbox'

export async function handleNotification (notificationRequest: NotificationRequest): Promise<void> {

  if (evaluate(notificationRequest.condition, notificationRequest.data)) {
    if (notificationRequest.type === NotificationType.WEBHOOK) {
      return executeWebhook(notificationRequest.callbackUrl, notificationRequest.dataLocation)
    } else { // different notification types might be implemented later
      throw new Error('notification type not implemented')
    }
  } else { // no need to trigger notification
    Promise.resolve()
  }
}

async function executeWebhook (callbackUrl: string, dataLocation: string): Promise<void> {
  const callbackObject: WebhookCallback = {
    location: dataLocation,
    timestamp: new Date(Date.now())
  }
  await axios.post(callbackUrl, callbackObject)
}
