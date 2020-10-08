import * as AMQP from 'amqplib'
import AmqpConsumer from '../../util/amqpConsumer'
import PipelineConfigEventHandler from '../pipelineConfigEventHandler'
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
  consumeEvent = (msg: AMQP.ConsumeMessage | null): void => {
    if (msg === null) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_CREATED_TOPIC) {
      this.pipelineConfigEventHandler.handleCreation(JSON.parse(msg.content.toString()))
        .catch(error => console.log('Failed to handle pipeline config creation event', error))
    } else if (msg.fields.routingKey === AMQP_PIPELINE_CONFIG_DELETED_TOPIC) {
      this.pipelineConfigEventHandler.handleDeletion(JSON.parse(msg.content.toString()))
        .catch(error => console.log('Failed to handle pipeline config deletion event', error))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
