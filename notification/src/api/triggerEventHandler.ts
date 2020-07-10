import { TransformationEvent } from "./transformationEvent"
import { NotificationMessageFactory } from "./notificationMessageFactory"
import { NotificationRepository } from "../notification-config/notificationRepository"
import NotificationExecutor from "../notification-execution/notificationExecutor"
import { CONFIG_TYPE } from "../notification-config/notificationConfig"

export class TriggerEventHandler {

  notificationRepository: NotificationRepository
  notificationExecutor: NotificationExecutor

  constructor(notificationRepository: NotificationRepository, notificationExecutor: NotificationExecutor) {
    this.notificationRepository = notificationRepository
    this.notificationExecutor = notificationExecutor
  }

  /**
   * Handles an event message
   * @param transformationEvent Message received from the message queue
   *
   * @returns true on success, else false
   */
  public async handleEvent(transformationEvent: TransformationEvent): Promise<void> {
    const isValid = this.isValidTransformationEvent(transformationEvent)
    if (!isValid) {
        return Promise.reject('Trigger event is not valid')
    }

    const message = NotificationMessageFactory.buildMessage(transformationEvent)
    const data = transformationEvent.jobResult.data
    const configs = await this.notificationRepository.getConfigsForPipeline(transformationEvent.pipelineId)

    const notificationJobs: Promise<void>[] = []
    for (const webhookConfig of configs.webhook) {
        notificationJobs.push(
          this.notificationExecutor.handleNotification(webhookConfig, CONFIG_TYPE.WEBHOOK, transformationEvent.dataLocation, message, data)
        )
    }

    for (const slackConfig of configs.slack) {
      notificationJobs.push(
        this.notificationExecutor.handleNotification(slackConfig, CONFIG_TYPE.SLACK, transformationEvent.dataLocation, message, data)
        )
    }


    for (const firebaseConfig of configs.firebase) {
      notificationJobs.push(
        this.notificationExecutor.handleNotification(firebaseConfig, CONFIG_TYPE.FCM, transformationEvent.dataLocation, message, data)
        )
    }

    await Promise.all(notificationJobs)
    return Promise.resolve()
  }


  /**
      * Checks if this event is a valid transformation event,
      * by checking if all field variables exist and are set.
      *
      * @returns     true, if param event is a TransformationEvent, else false
      */
  public isValidTransformationEvent(event: TransformationEvent): boolean {
      return !!event.dataLocation && !!event.pipelineId && !!event.pipelineName && !!event.jobResult
  }
}
