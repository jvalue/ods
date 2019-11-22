import axios from 'axios'

import ExecutionResult from './interfaces/executionResult'
import JobResult from './interfaces/jobResult'
import Stats from './interfaces/stats'
import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'

import TransformationService from './interfaces/transformationService'
import SandboxExecutor from './interfaces/sandboxExecutor'
import SlackCallback from './interfaces/slackCallback'
import FcmCallback from './interfaces/fcmCallback'
import WebhookCallback from './interfaces/webhookCallback'

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
