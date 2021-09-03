import { NotificationRepository } from '../notification-config/notificationRepository';
import NotificationExecutor from '../notification-execution/notificationExecutor';

import * as NotificationMessageFactory from './notificationMessageFactory';
import { PipelineSuccessEvent, isValidPipelineSuccessEvent } from './pipelineEvent';

const NOTIFICATION_DATA_LOCATION_URL = process.env.NOTIFICATION_DATA_LOCATION_URL ?? 'localhost:9000/storage';

export class TriggerEventHandler {
  notificationRepository: NotificationRepository;
  notificationExecutor: NotificationExecutor;

  constructor(notificationRepository: NotificationRepository, notificationExecutor: NotificationExecutor) {
    this.notificationRepository = notificationRepository;
    this.notificationExecutor = notificationExecutor;
  }

  /**
   * Handles an event message
   * @param transformationEvent Message received from the message queue
   *
   * @returns true on success, else false
   */
  async handleEvent(transformationEvent: PipelineSuccessEvent): Promise<void> {
    if (!isValidPipelineSuccessEvent(transformationEvent)) {
      throw new Error('Trigger event is not valid');
    }

    const dataLocation = `${NOTIFICATION_DATA_LOCATION_URL}/${transformationEvent.pipelineId}`;

    const message = NotificationMessageFactory.buildMessage(transformationEvent, dataLocation);
    const data = transformationEvent.data;
    const configs = await this.notificationRepository.getForPipeline(transformationEvent.pipelineId);

    const notificationJobs: Array<Promise<void>> = [];
    for (const config of configs) {
      notificationJobs.push(this.notificationExecutor.execute(config, dataLocation, message, data));
    }

    await Promise.all(notificationJobs);
  }
}
