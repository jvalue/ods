import axios from 'axios'

import ExecutionResult from './interfaces/executionResult'
import JobResult from './interfaces/jobResult'
import Stats from './interfaces/stats'
import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'
import WebhookCallback from './interfaces/webhookCallback'

import TransformationService from './interfaces/transformationService'
import SandboxExecutor from './interfaces/sandboxExecutor'
import SlackCallback from './interfaces/slackCallback'

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
        return this.executeWebhook(notificationRequest.url, notificationRequest.dataLocation)
      case NotificationType.SLACK:
        return this.executeSlackNotification(notificationRequest)
      default:
        throw new Error(`Notification type ${notificationRequest.notificationType} not implemented.`)
    }
  }

  private async executeSlackNotification (request: NotificationRequest): Promise<void> {
    const callbackObject: SlackCallback = {
      text: `New data available for pipeline ${request.pipelineName}(${request.pipelineId}). Fetch at ${request.dataLocation}.`
    }
    await axios.post(request.url, callbackObject)
  }

  private async executeWebhook (callbackUrl: string, dataLocation: string): Promise<void> {
    const callbackObject: WebhookCallback = {
      location: dataLocation,
      timestamp: new Date(Date.now())
    }
    await axios.post(callbackUrl, callbackObject)
  }
}
