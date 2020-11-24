import { ConsumeMessage } from 'amqplib'
import { AmqpConsumer } from '@jvalue/node-dry-amqp'
import { stringifiers } from '@jvalue/node-dry-basics'

import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import { PipelineConfigTriggerRequest } from '../pipelineConfigTriggerRequest'
import {
  AMQP_URL,
  AMQP_DATASOURCE_EXECUTION_EXCHANGE,
  AMQP_DATASOURCE_EXECUTION_TOPIC,
  AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC,
  AMQP_PIPELINE_EXECUTION_QUEUE
} from '../../env'

export class PipelineConfigConsumer {
  private readonly amqpConsumer = new AmqpConsumer()

  constructor (private readonly pipelineManager: PipelineConfigManager) {}

  /**
   * Connects to Amqp Service and initializes a channel
   * @param retries   Number of retries to connect
   * @param backoff   Time to wait until the next retry
   */
  public async init (retries: number, backoff: number): Promise<void> {
    await this.amqpConsumer.init(AMQP_URL, retries, backoff)

    const exchange = { name: AMQP_DATASOURCE_EXECUTION_EXCHANGE, type: 'topic' }
    const exchangeOptions = {}
    const queue = { name: AMQP_PIPELINE_EXECUTION_QUEUE, routingKey: AMQP_DATASOURCE_EXECUTION_TOPIC }
    const queueOptions = {
      exclusive: false
    }
    await this.amqpConsumer.registerConsumer(exchange, exchangeOptions, queue, queueOptions, this.consumeEvent)
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on transformation executions - doing nothing')
    } else {
      console.debug(`[EventProduce] ${msg.fields.routingKey}: ${stringifiers.stringify(msg.content)}`)
      if (msg.fields.routingKey === AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC) {
        const triggerRequest: PipelineConfigTriggerRequest = JSON.parse(msg.content.toString())
        await this.pipelineManager.triggerConfig(triggerRequest.datasourceId, JSON.parse(triggerRequest.data))
      } else {
        console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
      }
    }
  }
}
