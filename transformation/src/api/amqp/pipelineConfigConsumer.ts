import * as AMQP from 'amqplib'
import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import pipelineConfigTriggerRequest from '../pipelineConfigTriggerRequest'

const amqpUrl = process.env.AMQP_URL!
const datasourceExecutionExchange = process.env.AMQP_DATASOURCE_EXECUTION_EXCHANGE!
const datasourceExecutionTopic = process.env.AMQP_DATASOURCE_EXECUTION_TOPIC!
const datasourceExecutionSuccessTopic = process.env.AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC!
const transformationExecutionQueue = process.env.AMQP_TRANSFORMATION_EXECUTION_QUEUE!


export class PipelineConfigConsumer {

  pipelineManager: PipelineConfigManager

  constructor(pipelineManager: PipelineConfigManager) {
    this.pipelineManager = pipelineManager
  }

  /**
   * Connects to Amqp Service and initializes a channel
   * @param retries   Number of retries to connect
   * @param backoff   Time to wait until the next retry
   */
  public async connect(retries: number, backoff: number): Promise<void> {
    console.log("AMQP URL: " + amqpUrl)
    for (let i = 1; i <= retries; i++) {
      try {
        const connection = await AMQP.connect(amqpUrl)
        await this.initChannel(connection)
        return
      } catch (error) {
        console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
        console.info(`Connecting to Amqp handler (${i}/${retries})`)
        await this.sleep(backoff)
        continue
      }
    }
    Promise.reject(`Could not establish connection to AMQP Broker (${amqpUrl})`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async initChannel(connection: AMQP.Connection) {
    console.log(`Initializing queue "${transformationExecutionQueue}" on exchange "${datasourceExecutionExchange}" with topic "${datasourceExecutionTopic}"`)
    const channel = await connection.createChannel()

    await channel.assertExchange(datasourceExecutionExchange, 'topic', {
      durable: false
    })

    const q = await channel.assertQueue(transformationExecutionQueue, {
      exclusive: false,
    })
    await channel.bindQueue(q.queue, datasourceExecutionExchange, datasourceExecutionExchange)

    await channel.consume(q.queue, this.consumeEvent)
    console.info(`Successfully initialized AMQP queue`)
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null) => {
    if (!msg) {
      console.debug("Received empty event when listening on transformation executions - doing nothing")
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === datasourceExecutionSuccessTopic) {
      const triggerRequest: pipelineConfigTriggerRequest = JSON.parse(msg.content.toString())
      await this.pipelineManager.triggerConfig(triggerRequest.datasourceId, triggerRequest.data)

    } else {
      console.debug("Received unsubscribed event on topic %s - doing nothing", msg.fields.routingKey)
    }
  }
}
