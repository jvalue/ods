import * as AMQP from 'amqplib'
import AmqpConsumer from './amqpConsumer'
import PipelineExecutionEventHandler from '../pipelineExecutionEventHandler'

const AMQP_URL = process.env.AMQP_URL!
const AMQP_EXECUTION_EXCHANGE = process.env.AMQP_PIPELINE_EXECUTION_EXCHANGE!
const AMQP_EXECUTION_QUEUE = process.env.AMQP_PIPELINE_EXECUTION_QUEUE!
const AMQP_EXECUTION_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_TOPIC!
const AMQP_EXECUTION_SUCCESS_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC!

export class PipelineExecutionConsumer {
  private consumer: AmqpConsumer
  private pipelineExecutionEventHandler: PipelineExecutionEventHandler

  constructor (pipelineExecutionEventHandler: PipelineExecutionEventHandler) {
    this.pipelineExecutionEventHandler = pipelineExecutionEventHandler
    this.consumer = new AmqpConsumer()
  }

  async init (retries: number, msBackoff: number): Promise<void> {
    await this.consumer.init(AMQP_URL, retries, msBackoff)
    return this.consumer.consume(AMQP_EXECUTION_EXCHANGE, AMQP_EXECUTION_TOPIC, AMQP_EXECUTION_QUEUE, this.consumeEvent)
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === AMQP_EXECUTION_SUCCESS_TOPIC) {
      await this.pipelineExecutionEventHandler.handleSuccess(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
