import axios from 'axios'
import * as firebaseAdmin from 'firebase-admin'

import ExecutionResult from './interfaces/executionResult'
import JobResult from './interfaces/jobResult'
import Stats from './interfaces/stats'
import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'

import TransformationService from './interfaces/transformationService'
import SandboxExecutor from './interfaces/sandboxExecutor'
import SlackCallback from './interfaces/slackCallback'
import FcmCallback from './interfaces/fcmCallback'
import WebhookCallback from './interfaces/webhookCallback'
import { stringLiteral } from '@babel/types'

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

    switch (notificationRequest.notificationType) {
      case NotificationType.WEBHOOK:
        await this.handleWebhook(notificationRequest)
        break
      case NotificationType.FCM:
        await this.handleFCM(notificationRequest)
        break
      case NotificationType.SLACK:
        await this.handleSlack(notificationRequest)
        break
      default:
        throw new Error(`Notification type ${notificationRequest.notificationType} not implemented.`)
    }
  }

  private async handleWebhook (request: NotificationRequest): Promise<void> {
    const callbackObject: WebhookCallback = {
      location: request.dataLocation,
      timestamp: new Date(Date.now())
    }
    await axios.post(request.url, callbackObject)
  }

  private async handleSlack (request: NotificationRequest): Promise<void> {
    const callbackObject: SlackCallback = {
      text: `New data available for pipeline ${request.pipelineName}(${request.pipelineId}). ` +
        `Fetch at ${request.dataLocation}.`
    }
    await axios.post(request.url, callbackObject)
  }

  private async handleFCM (request: NotificationRequest): Promise<void> {

    var firebaseMessage: FcmCallback = {
      notification: {
        title: 'New Data Available',
        body: `Pipeline ${request.pipelineName}(${request.pipelineId}) has new data available.` +
          `Fetch at ${request.dataLocation}.`
      },
      topic: 'test'
    }

    // Providing a service account object inline
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: 'nebelalarm',
        clientEmail: 'firebase-adminsdk-th6w9@nebelalarm.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCxY1BIf1aivKlb\nYx11lnEDx/AD6I/W5rf+/wtpv2OSF9U+xUYg57k7NYhfHsGj33dU+cNplZ1lsmx4\noV9eUEgbpOjfM0PRwbxfs+51bHIuewdtX8EjN7+Zh176NRVv8CwSTjxd8XYp/Mse\n5Zy1EECTHNp+rSc9QxV224TeebVD8Pm/n6EMEm9MKDsFJe5NIc4MK6t2AVL6xvww\nNTam26pE+Sfa77/2a6IkFSTu1Xr8IAqa2HZ29Ttodsf3wKbWr2drlfxHdtz2bjbB\n6FElY9jVMNqXsSF3+3zrVyQ3lmuH4Qy+bpbsSALyb2kWVK4rQoYbG+NFJcMSeiuu\nqRqnQ4mDAgMBAAECggEAGWHjoAFl7TK1F8Lj+T/F+3YwOERJKMVUzg5tR1FqjFdl\nXRkErZAFfPJuXrtblqOoQ1GF47rT4zRtDwnQSAI8Kdsms0wg8ofCo6hvK6rmimjH\nqZ/frAwTGi3jqkZ5mHiJEIl/W9XsREUhmicy4uRoyQ7Xjkl1Pu/gHLomlgsGTqqT\n1Y4HTJeMrwJUcatdXBH7vSgaK/vuVI3sqR56ytvea9oHQNPnDWoTMo+SoyBW7ccs\nOqlQyJYWJBt2FBtrQtSVqlKM2jr/94bzdUN2FAq0I8e006Rv5fwvTcU3VVHIr6M3\nFK+tKfyNLKhO5kJCgi2Tb0sMVHf7LI1SH+WaKFib0QKBgQD63MLExNRySIZpgVb6\nr1F/gw1CZ01TcPfupRmUFwDyaSBLqIAxsIpobp02If6RxgYV8pq5WhJvVvSBT2gZ\nMjdsWlnLHwHfZFJNB5TP7oEoUZDXbXYJpXjwHUsh3vDR4iR5MoslJuKsQVkZ5bo7\n8kHOdqF9XsKOpWoV14GV22LUGwKBgQC1BVX9W1Hvsf1k1DDRQONSNULKdSKILvEn\nB8A7SkBc0MK1chMIsNeucJcs8M+cj9kqhb9uyS6TxdQ45H1xN617beZgsQBDnUtz\nLATrifrvYSHt8bcD60I51ewOubD3KXTerPs50Umpicgg1stvlLc4mNOVsgBkfB5K\nIU4+y1jmuQKBgQC0v6NGC1vXDBJsqlh1PyTFbzN6iNvaJyc8t5B6dyijgMNYQAw9\nwSm4nRqBCnVVqwxve+GncxKdTlXVZdVnchsk4uSXybubrbju72t1di9xUXO/BItr\n3+IHf9PGj8+MKhiFirlfB2mDG4KLek55Ks/nZupsXn5oMR8CpcgkpXHLyQKBgQCW\nzDolFCT+u9SuYUHFn/t+6VWZmNjKf+hurjtKaQGTEGmTg9MtYzxZWfvl+TnKX972\nWHLv1HKTsbKoLlf9r/c6IoRPOkRRD0DiUeJLYSeEsPL16G2guyPxUC8U2UX9sDBm\nq82hDaMCs//es3DHpCi54j4orx86llcZRAONthJ6KQKBgQCIEXEdOryxHJc+JIy0\nQhrnm/il6z5MWNaVdRKx10xcw/GAh7OYQkJAg6LbfQo/frNGT4l4VEHG1m5utCCQ\nbCWpXNkNcQGyry55bKAh9HpZmh0yt8A/6zcJatAe+xujgW0aWU4bIEJTo/KbUNgJ\nGYwrY0yu2CP1sUxetyZ/mYVklw==\n-----END PRIVATE KEY-----\n'
      }),
      databaseURL: 'https://nebelalarm.firebaseio.com'
    });

    firebaseAdmin.messaging().send(firebaseMessage)
    throw new Error('Notification type FCM not implemented.')
  }
}
