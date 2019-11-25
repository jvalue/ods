import axios from 'axios'
import * as firebaseAdmin from 'firebase-admin'
import Message from 'firebase-admin'

import ExecutionResult from './interfaces/executionResult'
import JobResult from './interfaces/jobResult'
import Stats from './interfaces/stats'
import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'

import TransformationService from './interfaces/transformationService'
import SandboxExecutor from './interfaces/sandboxExecutor'
import SlackCallback from './interfaces/slackCallback'
import FcmCallback from './interfaces/fcmCallback'
import WebhookCallback from './interfaces/webhookCallback'
import admin = require('firebase-admin')

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

  async handleNotification (notificationRequest: NotificationRequest): Promise<void> {
    console.log('NotificationRequest received: ' + JSON.stringify(notificationRequest))
    const conditionHolds = this.executor.evaluate(notificationRequest.condition, notificationRequest.data)
    console.log('Condition is ' + conditionHolds)
    if (!conditionHolds) { // no need to trigger notification
      return Promise.resolve()
    }

    const callbackObject = JSTransformationService.createCallbackObject(notificationRequest)
    const serviceAccount = require('/home/mathias/ods/nebelalarm/nebelalarm-firebase-adminsdk-th6w9-b1b9d8cd24.json')

    if(notificationRequest.notificationType == NotificationType.FCM) {
      firebaseAdmin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://nebelalarm.firebaseio.com'
      })
      console.log('aaa')
      var message = {
        data: {
          score: '123'
        },
        topic: 'test'
      }

      console.log('premessaging')
      const messaging = firebaseAdmin.messaging()
      console.log('aftermessaging')
      const response = await messaging.send(message, true)
      console.log(`success: ${response}`)
      return
    }
    await axios.post(notificationRequest.url, callbackObject)
  }

  private static createCallbackObject (request: NotificationRequest): SlackCallback | WebhookCallback | FcmCallback {
    switch (request.notificationType) {
      case NotificationType.WEBHOOK:
        return {
          location: request.dataLocation,
          timestamp: new Date(Date.now())
        }
      case NotificationType.SLACK:
        return {
          text: `New data available for pipeline ${request.pipelineName}(${request.pipelineId}). ` +
            `Fetch at ${request.dataLocation}.`
        }
      case NotificationType.FCM:
        return {
          // eslint-disable-next-line @typescript-eslint/camelcase
          validate_only: false,
          message: {
            notification: {
              title: 'New Data Available',
              body: `Pipeline ${request.pipelineName}(${request.pipelineId}) has new data available.` +
                `Fetch at ${request.dataLocation}.`
            }
          }
        }
      default:
        throw new Error(`Notification type ${request.notificationType} not implemented.`)
    }
  }
}
