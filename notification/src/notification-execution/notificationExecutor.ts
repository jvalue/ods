import axios from 'axios'
import * as firebase from 'firebase-admin'

import {
  FirebaseConfig,
  SlackConfig,
  WebhookConfig
} from '../notification-config/notificationConfig'

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

  async handleWebhook (webhook: WebhookConfig, dataLocation: string, message: string, data?: object): Promise<void> {
    console.log(`WebhookNotificationRequest received for pipeline: ${webhook.pipelineId}.`)
    const conditionHolds = this.executor.evaluate(webhook.condition, data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return
    }

    const callbackObject: WebhookCallback = {
      location: dataLocation,
      message: message,
      timestamp: new Date(Date.now())
    }
    console.log(`Posting webhook to ${webhook.url}, callback object: ${JSON.stringify(callbackObject)}.`)
    await axios.post(webhook.url, callbackObject)
  }

  async handleSlack (slack: SlackConfig, dataLocation: string, message: string, data?: object): Promise<void> {
    console.log(`SlackNotificationRequest received for pipeline: ${slack.pipelineId}.`)
    const conditionHolds = this.executor.evaluate(slack.condition, data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return
    }

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

  async handleFCM
  (firebaseConfig: FirebaseConfig, dataLocation: string, message: string, data?: object): Promise<void> {
    console.log(`FirebaseNotificationRequest received for pipeline: ${firebaseConfig.pipelineId}.`)
    const conditionHolds = this.executor.evaluate(firebaseConfig.condition, data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return
    }

    let app: App
    try {
      app = firebase.app(firebaseConfig.clientEmail)
    } catch (e) { // app does not exist yet
      app = firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
      },
      firebaseConfig.clientEmail)
    }
    const firebaseMessage: FcmCallback = {
      notification: {
        title: 'New Data Available',
        body: dataLocation
      },
      data: {
        message: message
      },
      topic: firebaseConfig.topic
    }
    console.log(`Sending firebase message, callback object: ${JSON.stringify(firebaseMessage)}.`)
    const firebaseResponse = await firebase.messaging(app).send(firebaseMessage)
    console.log(`Firebase message sent to: ${firebaseResponse}`)
  }
}
