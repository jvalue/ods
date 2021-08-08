import * as AMQP from 'amqplib'
import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp'

import {
  AMQP_PIPELINE_EXECUTION_EXCHANGE,
  AMQP_PIPELINE_EXECUTION_QUEUE,
  AMQP_PIPELINE_EXECUTION_QUEUE_TOPIC,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
} from '../../env'
import { PipelineExecutionEventHandler } from '../pipelineExecutionEventHandler'

export async function createPipelineExecutionEventConsumer (amqpConnection: AmqpConnection,
  executionEventHandler: PipelineExecutionEventHandler): Promise<PipelineExecutionConsumer> {
  const channel = await amqpConnection.createChannel()
  const pipelineExecutionConsumer = new PipelineExecutionConsumer(executionEventHandler, channel)
  await pipelineExecutionConsumer.init()
  return pipelineExecutionConsumer
}

export class PipelineExecutionConsumer {
  constructor (
    private readonly pipelineExecutionEventHandler: PipelineExecutionEventHandler,
    private readonly amqpChannel: AmqpChannel) {}

  async init (): Promise<void> {
    await this.amqpChannel.assertExchange(AMQP_PIPELINE_EXECUTION_EXCHANGE, 'topic')
    await this.amqpChannel.assertQueue(AMQP_PIPELINE_EXECUTION_QUEUE, { exclusive: false })
    await this.amqpChannel.bindQueue(
      AMQP_PIPELINE_EXECUTION_QUEUE, AMQP_PIPELINE_EXECUTION_EXCHANGE, AMQP_PIPELINE_EXECUTION_QUEUE_TOPIC)

    await this.amqpChannel.consume(AMQP_PIPELINE_EXECUTION_QUEUE, this.consumeEvent)
  }

  // use the f = () => {} syntax to access 'this' scope
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    if (msg.fields.routingKey === AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC) {
      console.log(msg.content.toString())
      await this.pipelineExecutionEventHandler.handleSuccess(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
    await this.amqpChannel.ack(msg)
  }
}
