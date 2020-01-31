import axios from 'axios'
import * as firebase from 'firebase-admin'

import ExecutionResult from './interfaces/executionResult'
import JobResult from './interfaces/jobResult'
import Stats from './interfaces/stats'
import { NotificationRequest_v1, FirebaseParams, SlackParams, WebhookParams } from './interfaces/notificationRequest_v1'

import TransformationService from './interfaces/transformationService'
import SandboxExecutor from './interfaces/sandboxExecutor'
import SlackCallback from './interfaces/slackCallback'
import FcmCallback from './interfaces/fcmCallback'
import WebhookCallback from './interfaces/webhookCallback'
import { Firebase, NotificationRequest, Slack, Webhook } from '@/interfaces/notificationRequest'
import App = firebase.app.App;

const VERSION = '0.0.2'

export default class JSTransformationService implements TransformationService {
  executor: SandboxExecutor

  constructor (executor: SandboxExecutor) {
    this.executor = executor
  }

  getVersion (): string {
    return VERSION
  }

  private executionTimeInMillis (func: () => ExecutionResult): [number, ExecutionResult] {
    const start = process.hrtime()
    const result = func()
    const hrresult = process.hrtime(start)
    const time = hrresult[0] * 1e3 + hrresult[1] / 1e6
    return [time, result]
  }

  executeJob (code: string, data: object): JobResult {
    const startTimestamp = Date.now()

    const [time, result] = this.executionTimeInMillis(() => this.executor.execute(code, data))

    const endTimestamp = Date.now()

    if (result.error === undefined && (result.data === undefined || result.data === null)) {
      result.data = undefined
      result.error = {
        name: 'MissingReturnError',
        message: 'Code snippet is not returning valid data',
        lineNumber: 0,
        position: 0,
        stacktrace: []
      }
    }

    const stats: Stats = {
      durationInMilliSeconds: time,
      startTimestamp,
      endTimestamp
    }
    const jobResult: JobResult = { ...result, stats }
    return jobResult
  }

  async handleNotificationv1 (notificationRequest: NotificationRequest_v1): Promise<void> {
    console.log(`NotificationRequest received for pipeline: ${notificationRequest.pipelineId}:
    ${JSON.stringify(notificationRequest.params)}.`)
    const conditionHolds = this.executor.evaluate(notificationRequest.condition, notificationRequest.data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return Promise.resolve()
    }

    const message = `Pipeline ${notificationRequest.pipelineName}(${notificationRequest.pipelineId}) ` +
    `has new data available. Fetch at ${notificationRequest.dataLocation}.`

    switch (notificationRequest.params.type) {
      case 'WEBHOOK':
        await this.handleWebhookv1(notificationRequest.params, notificationRequest.dataLocation)
        break
      case 'FCM':
        await this.handleFCMv1(notificationRequest.params, message)
        break
      case 'SLACK':
        await this.handleSlackv1(notificationRequest.params, message)
        break
      default:
        throw new Error('Notification type not implemented.')
    }
  }

  private async handleWebhookv1 (params: WebhookParams, location: string): Promise<void> {
    const callbackObject: WebhookCallback = {
      location,
      timestamp: new Date(Date.now())
    }
    console.log(`Posting webhook to ${params.url}, callback object: ${JSON.stringify(callbackObject)}.`)
    await axios.post(params.url, callbackObject)
  }

  private async handleSlackv1 (params: SlackParams, message: string): Promise<void> {
    let slackBaseUri = 'https://hooks.slack.com/services'
    if (process.env.MOCK_RECEIVER_HOST && process.env.MOCK_RECEIVER_PORT) {
      slackBaseUri = `http://${process.env.MOCK_RECEIVER_HOST}:${process.env.MOCK_RECEIVER_PORT}/slack`
    }
    const callbackObject: SlackCallback = {
      text: message
    }
    const url = `${slackBaseUri}/${params.workspaceId}/${params.channelId}/${params.secret}`
    console.log(`Posting slack notification to ${url}, callbackObject: ${JSON.stringify(callbackObject)}`)
    await axios.post(url, callbackObject)
  }

  private async handleFCMv1 (params: FirebaseParams, message: string): Promise<void> {
    let app: App
    try {
      app = firebase.app(params.clientEmail)
    } catch (e) { // app does not exist yet
      app = firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: params.projectId,
          clientEmail: params.clientEmail,
          privateKey: params.privateKey.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${params.projectId}.firebaseio.com`
      },
      params.clientEmail)
    }
    const firebaseMessage: FcmCallback = {
      notification: {
        title: 'New Data Available',
        body: message
      },
      data: {
        textfield: 'textvalue'
      },
      topic: params.topic
    }
    console.log(`Sending firebase message, callback object: ${JSON.stringify(firebaseMessage)}.`)
    const firebaseResponse = await firebase.messaging(app).send(firebaseMessage)
    console.log(`Firebase message sent to: ${firebaseResponse}`)
  }

  async handleNotification (notification: NotificationRequest): Promise<void> {
    console.log(`NotificationRequest received for pipeline: ${notification.pipelineId}.`)
    const conditionHolds = this.executor.evaluate(notification.condition, notification.data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return Promise.resolve()
    }

    const message = `Pipeline ${notification.pipelineName}(${notification.pipelineId}) ` +
      `has new data available. Fetch at ${notification.dataLocation}.`


    switch (notification.type) {
      case 'WEBHOOK':
        await this.handleWebhook(notification as Webhook)
        break
      case 'FCM':
        await this.handleFCM(notification as Firebase, message)
        break
      case 'SLACK':
        await this.handleSlack(notification as Slack, message)
        break
      default:
        throw new Error('Notification type not implemented.')
    }
  }

  private async handleWebhook (webhook: Webhook): Promise<void> {
    const callbackObject: WebhookCallback = {
      location: webhook.dataLocation,
      timestamp: new Date(Date.now())
    }
    console.log(`Posting webhook to ${webhook.url}, callback object: ${JSON.stringify(callbackObject)}.`)
    await axios.post(webhook.url, callbackObject)
  }

  private async handleSlack (slack: Slack, message: string): Promise<void> {
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

  private async handleFCM (firebaseRequest: Firebase, message: string): Promise<void> {
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
        body: message
      },
      data: {
        textfield: 'textvalue'
      },
      topic: firebaseRequest.topic
    }
    console.log(`Sending firebase message, callback object: ${JSON.stringify(firebaseMessage)}.`)
    const firebaseResponse = await firebase.messaging(app).send(firebaseMessage)
    console.log(`Firebase message sent to: ${firebaseResponse}`)
  }
}
