import { ConsumeMessage } from 'amqplib'
import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp'

import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import { PipelineConfigTriggerRequest } from '../pipelineConfigTriggerRequest'
import {
  AMQP_DATASOURCE_EXECUTION_EXCHANGE,
  AMQP_DATASOURCE_EXECUTION_QUEUE,
  AMQP_DATASOURCE_EXECUTION_QUEUE_TOPIC,
  AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC
} from '../../env'

export async function createDatasourceExecutionConsumer (amqpConnection: AmqpConnection,
  pipelineManager: PipelineConfigManager): Promise<DatasourceExecutionConsumer> {
  const channel = await amqpConnection.createChannel()
  const datasourceExecutionConsumer = new DatasourceExecutionConsumer(channel, pipelineManager)
  await datasourceExecutionConsumer.init()
  return datasourceExecutionConsumer
}

export class DatasourceExecutionConsumer {
  constructor (
    private readonly amqpChannel: AmqpChannel,
    private readonly pipelineManager: PipelineConfigManager
  ) {}

  /** Initializes the datasource execution consumer */
  public async init (): Promise<void> {
    await this.amqpChannel.assertExchange(AMQP_DATASOURCE_EXECUTION_EXCHANGE, 'topic')
    await this.amqpChannel.assertQueue(AMQP_DATASOURCE_EXECUTION_QUEUE, { exclusive: false })
    await this.amqpChannel.bindQueue(
      AMQP_DATASOURCE_EXECUTION_QUEUE, AMQP_DATASOURCE_EXECUTION_EXCHANGE, AMQP_DATASOURCE_EXECUTION_QUEUE_TOPIC
    )

    await this.amqpChannel.consume(AMQP_DATASOURCE_EXECUTION_QUEUE, this.consumeEvent)
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on datasource executions - doing nothing')
      return
    }

    if (msg.fields.routingKey === AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC) {
      const triggerRequest: PipelineConfigTriggerRequest = JSON.parse(msg.content.toString())
      await this.pipelineManager.triggerConfig(triggerRequest.datasourceId, JSON.parse(triggerRequest.data))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
    await this.amqpChannel.ack(msg)
  }
}
