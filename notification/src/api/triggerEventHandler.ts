import { PipelineEvent } from './transformationEvent'
import * as NotificationMessageFactory from './notificationMessageFactory'
import { NotificationRepository } from '../notification-config/notificationRepository'
import NotificationExecutor from '../notification-execution/notificationExecutor'
import { hasProperty, isObject } from '../validators'

const NOTIFICATION_DATA_LOCATION_URL = process.env.NOTIFICATION_DATA_LOCATION_URL || 'localhost:9000/storage'

export class TriggerEventHandler {
  notificationRepository: NotificationRepository
  notificationExecutor: NotificationExecutor

  constructor (notificationRepository: NotificationRepository, notificationExecutor: NotificationExecutor) {
    this.notificationRepository = notificationRepository
    this.notificationExecutor = notificationExecutor
  }

  /**
   * Handles an event message
   * @param transformationEvent Message received from the message queue
   *
   * @returns true on success, else false
   */
  public async handleEvent (transformationEvent: PipelineEvent): Promise<void> {
    if (!this.isValidPipelineEvent(transformationEvent)) {
      throw new Error('Trigger event is not valid')
    }

    const dataLocation = `${NOTIFICATION_DATA_LOCATION_URL}/${transformationEvent.pipelineId}`

    const message = NotificationMessageFactory.buildMessage(transformationEvent, dataLocation)
    const data = transformationEvent.data
    const configs = await this.notificationRepository.getConfigsForPipeline(transformationEvent.pipelineId)

    const notificationJobs: Promise<void>[] = []
    for (const webhookConfig of configs.webhook) {
      notificationJobs.push(this.notificationExecutor.handleWebhook(webhookConfig, dataLocation, message, data))
    }

    for (const slackConfig of configs.slack) {
      notificationJobs.push(this.notificationExecutor.handleSlack(slackConfig, dataLocation, message, data))
    }

    for (const firebaseConfig of configs.firebase) {
      notificationJobs.push(this.notificationExecutor.handleFCM(firebaseConfig, dataLocation, message, data))
    }

    await Promise.all(notificationJobs)
  }

  /**
      * Checks if this event is a valid transformation event,
      * by checking if all field variables exist and are set.
      *
      * @returns     true, if param event is a PipelineEvent, else false
      */
  public isValidPipelineEvent (event: unknown): event is PipelineEvent {
    return isObject(event) &&
      hasProperty(event, 'pipelineId') &&
      hasProperty(event, 'pipelineName') &&
      (hasProperty(event, 'data') || hasProperty(event, 'error'))
  }
}
