import * as AMQP from 'amqplib'
import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import { PipelineConfigTriggerRequestAmpq } from './pipelineConfigTriggerRequestAmpq'
import {
  AMQP_URL,
  AMQP_DATASOURCE_EXECUTION_EXCHANGE,
  AMQP_DATASOURCE_EXECUTION_TOPIC,
  AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC,
  AMQP_TRANSFORMATION_EXECUTION_QUEUE
} from '../../env'

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
    console.log('AMQP URL: ' + AMQP_URL)
    for (let i = 1; i <= retries; i++) {
      try {
        const connection = await AMQP.connect(AMQP_URL)
        await this.initChannel(connection)
        return
      } catch (error) {
        if (i >= retries) {
          console.error(`Could not establish connection to AMQP Broker (${AMQP_URL})`)
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
    console.log(`Initializing queue "${AMQP_TRANSFORMATION_EXECUTION_QUEUE}"
      on exchange "${AMQP_DATASOURCE_EXECUTION_EXCHANGE}" with topic "${AMQP_DATASOURCE_EXECUTION_TOPIC}"`)

    const channel = await connection.createChannel()

    await channel.assertExchange(AMQP_DATASOURCE_EXECUTION_EXCHANGE, 'topic')

    const q = await channel.assertQueue(AMQP_TRANSFORMATION_EXECUTION_QUEUE, {
      exclusive: false
    })
    await channel.bindQueue(q.queue, AMQP_DATASOURCE_EXECUTION_EXCHANGE, AMQP_DATASOURCE_EXECUTION_TOPIC)

    await channel.consume(q.queue, this.consumeEvent)
    console.info('Successfully initialized AMQP queue')
    return Promise.resolve()
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on transformation executions - doing nothing')
    } else {
      try {
        console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
        if (msg.fields.routingKey === AMQP_DATASOURCE_EXECUTION_SUCCESS_TOPIC) {
          const triggerRequest: PipelineConfigTriggerRequestAmpq = JSON.parse(msg.content.toString())
          await this.pipelineManager.triggerConfig(triggerRequest.datasourceId, JSON.parse(triggerRequest.data))
        } else {
          console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
        }
      } catch (e) {
        console.error(`Error in amqp event consumption: ${e.message}`)
      }
    }
  }
}
