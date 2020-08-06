import axios from 'axios'
import * as firebase from 'firebase-admin'

import { CONFIG_TYPE, NotificationConfig, WebhookConfig, SlackConfig, FirebaseConfig } from '../notification-config/notificationConfig'

import SlackCallback from './notificationCallbacks/slackCallback'
import WebhookCallback from './notificationCallbacks/webhookCallback'
import FcmCallback from './notificationCallbacks/fcmCallback'

import SandboxExecutor from './condition-evaluation/sandboxExecutor'
import App = firebase.app.App;

const VERSION = '0.0.1'

export default class NotificationExecutor {
  executor: SandboxExecutor

  constructor (executor: SandboxExecutor) {
    this.executor = executor
  }

  getVersion (): string {
    return VERSION
  }

  async handleNotification (notification: NotificationConfig, type: CONFIG_TYPE, dataLocation: string, message: string, data?: object): Promise<void> {
    console.log(`NotificationRequest received for pipeline: ${notification.pipelineId}.`)

    const conditionHolds = this.executor.evaluate(notification.condition, data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return Promise.resolve()
    }

    switch (type) {
      case CONFIG_TYPE.WEBHOOK:
        await this.handleWebhook(notification as WebhookConfig, dataLocation, message)
        break
      case CONFIG_TYPE.FCM:
        await this.handleFCM(notification as FirebaseConfig, dataLocation, message)
        break
      case CONFIG_TYPE.SLACK:
        await this.handleSlack(notification as SlackConfig, dataLocation, message)
        break
      default:
        throw new Error('Notification type not implemented.')
    }
  }

  private async handleWebhook (webhook: WebhookConfig, dataLocation: string, message: string): Promise<void> {
    const callbackObject: WebhookCallback = {
      location: dataLocation,
      message: message,
      timestamp: new Date(Date.now())
    }
    console.log(`Posting webhook to ${webhook.url}, callback object: ${JSON.stringify(callbackObject)}.`)
    await axios.post(webhook.url, callbackObject)
  }

  private async handleSlack (slack: SlackConfig, dataLocation: string, message: string): Promise<void> {
    let slackBaseUri = 'https://hooks.slack.com/services'
    if (process.env.MOCK_RECEIVER_HOST && process.env.MOCK_RECEIVER_PORT) {
      slackBaseUri = `http://${process.env.MOCK_RECEIVER_HOST}:${process.env.MOCK_RECEIVER_PORT}/slack`
    }
    const callbackObject: SlackCallback = {
      text: message
    }
    const url = `${slackBaseUri}/${slack.workspaceId}/${slack.channelId}/${slack.secret}`
    console.log(`Posting slack notification to ${url}, callbackObject: ${JSON.stringify(callbackObject)}`)
    await axios.post(url, callbackObject)
  }

  private async handleFCM (firebaseRequest: FirebaseConfig, dataLocation: string, message: string): Promise<void> {
    let app: App
    try {
      app = firebase.app(firebaseRequest.clientEmail)
    } catch (e) { // app does not exist yet
      app = firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: firebaseRequest.projectId,
          clientEmail: firebaseRequest.clientEmail,
          privateKey: firebaseRequest.privateKey.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${firebaseRequest.projectId}.firebaseio.com`
      },
      firebaseRequest.clientEmail)
    }
    const firebaseMessage: FcmCallback = {
      notification: {
        title: 'New Data Available',
        body: dataLocation
      },
      data: {
        message: message
      },
      topic: firebaseRequest.topic
    }
    console.log(`Sending firebase message, callback object: ${JSON.stringify(firebaseMessage)}.`)
    const firebaseResponse = await firebase.messaging(app).send(firebaseMessage)
    console.log(`Firebase message sent to: ${firebaseResponse}`)
  }
}
