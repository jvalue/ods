import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp';
import * as AMQP from 'amqplib';

import {
  AMQP_PIPELINE_EXECUTION_EXCHANGE,
  AMQP_PIPELINE_EXECUTION_QUEUE,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
} from '../../env';
import { TriggerEventHandler } from '../triggerEventHandler';

export async function createPipelineSuccessConsumer(
  amqpConnection: AmqpConnection,
  triggerEventHandler: TriggerEventHandler,
): Promise<PipelineSuccessConsumer> {
  const channel = await amqpConnection.createChannel();
  const pipelineSuccessConsumer = new PipelineSuccessConsumer(channel, triggerEventHandler);
  await pipelineSuccessConsumer.init();
  return pipelineSuccessConsumer;
}

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
export class PipelineSuccessConsumer {
  constructor(private readonly amqpChannel: AmqpChannel, private readonly triggerEventHandler: TriggerEventHandler) {}

  /** Initializes the pipeline success consumer */
  async init(): Promise<void> {
    await this.amqpChannel.assertExchange(AMQP_PIPELINE_EXECUTION_EXCHANGE, 'topic');
    await this.amqpChannel.assertQueue(AMQP_PIPELINE_EXECUTION_QUEUE, { exclusive: false });
    await this.amqpChannel.bindQueue(
      AMQP_PIPELINE_EXECUTION_QUEUE,
      AMQP_PIPELINE_EXECUTION_EXCHANGE,
      AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
    );

    await this.amqpChannel.consume(AMQP_PIPELINE_EXECUTION_QUEUE, this.handleEvent);
  }

  private readonly handleEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg == null) {
      console.debug('Received empty event when listening on pipeline executions - doing nothing');
      return;
    }

    if (msg.fields.routingKey === AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC) {
      await this.triggerEventHandler.handleEvent(JSON.parse(msg.content.toString()));
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey);
    }
    await this.amqpChannel.ack(msg);
  };
}
