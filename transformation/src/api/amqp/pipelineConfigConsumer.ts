import * as AMQP from 'amqplib'
import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import pipelineConfigTriggerRequest from '../pipelineConfigTriggerRequest'

const amqpUrl = process.env.AMQP_URL || 'http://localhost:5672'
const datasourceExecutionExchange =
  process.env.AMQP_DATASOURCE_EXECUTION_EXCHANGE || 'ods_global'
const datasourceExecutionTopic =
  process.env.AMQP_DATASOURCE_EXECUTION_TOPIC || 'datasource.execution.*'
const datasourceExecutionSuccessTopic =
  process.env.AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC || 'datasource.execution.success'
const transformationExecutionQueue =
  process.env.AMQP_TRANSFORMATION_EXECUTION_QUEUE || 'transformation.transformation-execution'

export class PipelineConfigConsumer {
  pipelineManager: PipelineConfigManager

  constructor (pipelineManager: PipelineConfigManager) {
    this.pipelineManager = pipelineManager
  }

  /**
   * Connects to Amqp Service and initializes a channel
   * @param retries   Number of retries to connect
   * @param backoff   Time to wait until the next retry
   */
  public async connect (retries: number, backoff: number): Promise<void> {
    console.log('AMQP URL: ' + amqpUrl)
    for (let i = 1; i <= retries; i++) {
      try {
        const connection = await AMQP.connect(amqpUrl)
        await this.initChannel(connection)
        return
      } catch (error) {
        if (i >= retries) {
          console.error(`Could not establish connection to AMQP Broker (${amqpUrl})`)
          return Promise.reject(error)
        }
        console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
        console.info(`Connecting to Amqp handler (${i}/${retries})`)
        await this.sleep(backoff)
        continue
      }
    }
  }

  private sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async initChannel (connection: AMQP.Connection): Promise<void> {
    console.log(`Initializing queue "${transformationExecutionQueue}"
      on exchange "${datasourceExecutionExchange}" with topic "${datasourceExecutionTopic}"`)

    const channel = await connection.createChannel()

    await channel.assertExchange(datasourceExecutionExchange, 'topic')

    const q = await channel.assertQueue(transformationExecutionQueue, {
      exclusive: false
    })
    await channel.bindQueue(q.queue, datasourceExecutionExchange, datasourceExecutionTopic)

    await channel.consume(q.queue, this.consumeEvent)
    console.info('Successfully initialized AMQP queue')
    return Promise.resolve()
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on transformation executions - doing nothing')
    } else {
      console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
      if (msg.fields.routingKey === datasourceExecutionSuccessTopic) {
        const triggerRequest: pipelineConfigTriggerRequest = JSON.parse(msg.content.toString())
        await this.pipelineManager.triggerConfig(triggerRequest.datasourceId, triggerRequest.data)
      } else {
        console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
      }
    }
  }
}
