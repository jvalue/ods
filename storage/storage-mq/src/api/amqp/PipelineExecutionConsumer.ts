import * as AMQP from 'amqplib'
import AmqpConsumer from '../../util/amqpConsumer'
import PipelineExecutionEventHandler from '../pipelineExecutionEventHandler'
import {
  AMQP_URL,
  AMQP_PIPELINE_EXECUTION_EXCHANGE,
  AMQP_PIPELINE_EXECUTION_TOPIC,
  AMQP_PIPELINE_EXECUTION_QUEUE,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
} from '../../env'

export class PipelineExecutionConsumer {
  private consumer: AmqpConsumer
  private pipelineExecutionEventHandler: PipelineExecutionEventHandler

  constructor (pipelineExecutionEventHandler: PipelineExecutionEventHandler, consumer: AmqpConsumer) {
    this.pipelineExecutionEventHandler = pipelineExecutionEventHandler
    this.consumer = consumer
  }

  async init (retries: number, msBackoff: number): Promise<void> {
    await this.consumer.init(AMQP_URL, retries, msBackoff)
    return this.consumer.consume(
      AMQP_PIPELINE_EXECUTION_EXCHANGE,
      AMQP_PIPELINE_EXECUTION_TOPIC,
      AMQP_PIPELINE_EXECUTION_QUEUE,
      this.consumeEvent
    )
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC) {
      await this.pipelineExecutionEventHandler.handleSuccess(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
