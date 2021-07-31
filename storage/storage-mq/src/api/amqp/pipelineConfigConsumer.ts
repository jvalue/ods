import * as AMQP from 'amqplib'
import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp'

import {
  AMQP_PIPELINE_CONFIG_EXCHANGE,
  AMQP_PIPELINE_CONFIG_QUEUE,
  AMQP_PIPELINE_CONFIG_QUEUE_TOPIC,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '../../env'
import { PipelineConfigEventHandler } from '../pipelineConfigEventHandler'

export async function createPipelineConfigEventConsumer (amqpConnection: AmqpConnection,
  configEventHandler: PipelineConfigEventHandler): Promise<PipelineConfigConsumer> {
  const channel = await amqpConnection.createChannel()
  const pipelineConfigConsumer = new PipelineConfigConsumer(configEventHandler, channel)
  await pipelineConfigConsumer.init()
  return pipelineConfigConsumer
}

export class PipelineConfigConsumer {
  constructor (
    private readonly pipelineConfigEventHandler: PipelineConfigEventHandler,
    private readonly amqpChannel: AmqpChannel) {}

  async init (): Promise<void> {
    await this.amqpChannel.assertExchange(AMQP_PIPELINE_CONFIG_EXCHANGE, 'topic')
    await this.amqpChannel.assertQueue(AMQP_PIPELINE_CONFIG_QUEUE, { exclusive: false })
    await this.amqpChannel.bindQueue(
      AMQP_PIPELINE_CONFIG_QUEUE, AMQP_PIPELINE_CONFIG_EXCHANGE, AMQP_PIPELINE_CONFIG_QUEUE_TOPIC)

    await this.amqpChannel.consume(AMQP_PIPELINE_CONFIG_QUEUE, this.consumeEvent)±
  }

  // use the f = () => {} syntax to access 'this' scope
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_CREATED_TOPIC) {
      console.log(JSON.parse(msg.content.toString()))
      await this.pipelineConfigEventHandler.handleCreation(JSON.parse(msg.content.toString()))
    } else if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_DELETED_TOPIC) {
      await this.pipelineConfigEventHandler.handleDeletion(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
    await this.amqpChannel.ack(msg)
  }
}
