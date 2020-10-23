import * as AMQP from 'amqplib'
import AmqpConsumer from '../../util/amqpConsumer'
import PipelineConfigEventHandler, { PipelineCreatedEvent, PipelineDeletedEvent } from '../pipelineConfigEventHandler'
import {
  AMQP_URL,
  AMQP_PIPELINE_CONFIG_EXCHANGE,
  AMQP_PIPELINE_CONFIG_TOPIC,
  AMQP_PIPELINE_CONFIG_QUEUE,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '../../env'

export class PipelineConfigConsumer {
  constructor (
    private readonly pipelineConfigEventHandler: PipelineConfigEventHandler,
    private readonly consumer: AmqpConsumer) {}

  async init (retries: number, msBackoff: number): Promise<void> {
    await this.consumer.init(AMQP_URL, retries, msBackoff)
    await this.consumer.consume(
      AMQP_PIPELINE_CONFIG_EXCHANGE,
      AMQP_PIPELINE_CONFIG_TOPIC,
      AMQP_PIPELINE_CONFIG_QUEUE,
      this.consumeEvent
    )
  }

  // use the f = () => {} syntax to access 'this' scope
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_CREATED_TOPIC) {
      const event: PipelineCreatedEvent = JSON.parse(msg.content.toString())
      await this.pipelineConfigEventHandler.handleCreation(event)
    } else if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_DELETED_TOPIC) {
      const event: PipelineDeletedEvent = JSON.parse(msg.content.toString())
      console.debug()
      await this.pipelineConfigEventHandler.handleDeletion(event)
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
