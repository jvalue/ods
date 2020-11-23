import * as AMQP from 'amqplib'

import { AmqpConsumer } from '@jvalue/node-dry-amqp'
import { TriggerEventHandler } from '../triggerEventHandler'
import {
  AMQP_URL,
  AMQP_PIPELINE_EXECUTION_EXCHANGE,
  AMQP_PIPELINE_EXECUTION_QUEUE,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
} from '../../env'

/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with these channels:
 *
 *      * Notification Channel:
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see PipelineEvent for details of the event).
 *
 */
export class AmqpHandler {
  amqpConsumer: AmqpConsumer = new AmqpConsumer()

  constructor (private readonly triggerEventHandler: TriggerEventHandler) { }

  /**
     * Connects to Amqp Service and initializes a channel
     *
     * @param retries   Number of retries to connect to the notification-config db
     * @param ms   Time to wait until the next retry
     */
  public async init (retries: number, ms: number): Promise<void> {
    await this.amqpConsumer.init(AMQP_URL, retries, ms)
    await this.amqpConsumer.registerConsumer(
      { name: AMQP_PIPELINE_EXECUTION_EXCHANGE, type: 'topic' },
      {},
      { name: AMQP_PIPELINE_EXECUTION_QUEUE, routingKey: AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC },
      {
        exclusive: false
      },
      this.handleEvent
    )
  }

  private readonly handleEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on pipeline executions - doing nothing')
      return
    }

    if (msg.fields.routingKey === AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC) {
      await this.triggerEventHandler.handleEvent(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
