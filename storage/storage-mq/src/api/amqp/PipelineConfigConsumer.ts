import * as AMQP from 'amqplib'
import PipelineConfigEventHandler from '../pipelineConfigEventHandler'

const amqpUrl = process.env.AMQP_URL!
const pipelineConfigExchange = process.env.AMQP_PIPELINE_CONFIG_EXCHANGE!
const pipelineConfigQueue = process.env.AMQP_PIPELINE_CONFIG_QUEUE!
const pipelineConfigTopic = process.env.AMQP_PIPELINE_CONFIG_TOPIC!
const pipelineConfigCreatedTopic = process.env.AMQP_PIPELINE_CONFIG_CREATED_TOPIC!
const pipelineConfigDeletedTopic = process.env.AMQP_PIPELINE_CONFIG_DELETED_TOPIC!

export class PipelineConfigConsumer {
  pipelineConfigEventHandler: PipelineConfigEventHandler

  constructor (pipelineConfigEventHandler: PipelineConfigEventHandler) {
    this.pipelineConfigEventHandler = pipelineConfigEventHandler
  }

  /**
     * Connects to Amqp Service and initializes a channel
     * @param retries   Number of retries to connect to the notification-config db
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
        console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
        console.info(`Connecting to Amqp handler (${i}/${retries})`)
        await this.sleep(backoff)
        continue
      }
    }
    return Promise.reject(new Error(`Could not establish connection to AMQP Broker (${amqpUrl})`))
  }

  private sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async initChannel (connection: AMQP.Connection): Promise<void> {
    console.log(
      `Initializing queue "${pipelineConfigQueue}" on exchange "${pipelineConfigExchange}" ` +
      ` with topic "${pipelineConfigTopic}"`
    )

    await channel.assertExchange(pipelineConfigExchange, 'topic', {
      durable: false
    })

    const q = await channel.assertQueue(pipelineConfigQueue, {
      exclusive: false
    })
    await channel.bindQueue(q.queue, pipelineConfigExchange, pipelineConfigTopic)

    await channel.consume(q.queue, this.consumeEvent)
    console.info('Successfully initialized AMQP queue')
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (!msg) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === pipelineConfigCreatedTopic) {
      await this.pipelineConfigEventHandler.handleCreation(JSON.parse(msg.content.toString()))
    } else if (msg.fields.routingKey === pipelineConfigDeletedTopic) {
      await this.pipelineConfigEventHandler.handleDeletion(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
