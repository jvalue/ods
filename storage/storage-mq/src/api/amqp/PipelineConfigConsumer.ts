import * as AMQP from 'amqplib'
import AmqpConsumer from './amqpConsumer'
import PipelineConfigEventHandler from '../pipelineConfigEventHandler'

const AMQP_URL = process.env.AMQP_URL!
const AMQP_CONFIG_EXCHANGE = process.env.AMQP_PIPELINE_CONFIG_EXCHANGE!
const AMQP_CONFIG_QUEUE = process.env.AMQP_PIPELINE_CONFIG_QUEUE!
const AMQP_CONFIG_TOPIC = process.env.AMQP_PIPELINE_CONFIG_TOPIC!
const AMQP_CONFIG_CREATED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_CREATED_TOPIC!
const AMQP_CONFIG_DELETED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_DELETED_TOPIC!

export class PipelineConfigConsumer {
  private consumer: AmqpConsumer
  private pipelineConfigEventHandler: PipelineConfigEventHandler

  constructor (pipelineConfigEventHandler: PipelineConfigEventHandler) {
    this.pipelineConfigEventHandler = pipelineConfigEventHandler
    this.consumer = new AmqpConsumer()
  }

  async init (retries: number, msBackoff: number): Promise<void> {
    await this.consumer.init(AMQP_URL, retries, msBackoff)
    return this.consumer.consume(AMQP_CONFIG_EXCHANGE, AMQP_CONFIG_TOPIC, AMQP_CONFIG_QUEUE, this.consumeEvent)
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === AMQP_CONFIG_CREATED_TOPIC) {
      await this.pipelineConfigEventHandler.handleCreation(JSON.parse(msg.content.toString()))
    } else if (msg.fields.routingKey === AMQP_CONFIG_DELETED_TOPIC) {
      await this.pipelineConfigEventHandler.handleDeletion(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
