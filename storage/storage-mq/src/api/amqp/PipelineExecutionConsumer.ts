import * as AMQP from 'amqplib'
import PipelineExecutionEventHandler from '../pipelineExecutionEventHandler'

const amqpUrl = process.env.AMQP_URL!
const pipelineExecutionExchange = process.env.AMQP_PIPELINE_EXECUTION_EXCHANGE!
const pipelineExecutionQueue = process.env.AMQP_PIPELINE_EXECUTION_QUEUE!
const pipelineExecutionTopic = process.env.AMQP_PIPELINE_EXECUTION_TOPIC!
const pipelineExecutionSuccessTopic = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC!

export class PipelineExecutionConsumer {
  pipelineExecutionEventHandler: PipelineExecutionEventHandler

  constructor (pipelineExecutionEventHandler: PipelineExecutionEventHandler) {
    this.pipelineExecutionEventHandler = pipelineExecutionEventHandler
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
    Promise.reject(`Could not establish connection to AMQP Broker (${amqpUrl})`)
  }

  private sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async initChannel (connection: AMQP.Connection) {
    console.log(`Initializing queue "${pipelineExecutionQueue}" on exchange "${pipelineExecutionExchange}" with topic "${pipelineExecutionTopic}"`)
    const channel = await connection.createChannel()

    channel.assertExchange(pipelineExecutionExchange, 'topic', {
      durable: false
    })

    const q = await channel.assertQueue(pipelineExecutionQueue, {
      exclusive: false
    })
    channel.bindQueue(q.queue, pipelineExecutionExchange, pipelineExecutionTopic)

    channel.consume(q.queue, this.consumeEvent)
    console.info('Successfully initialized AMQP queue')
  }

  // use the f = () => {} syntax to access this
  consumeEvent = async (msg: AMQP.ConsumeMessage | null) => {
    if (!msg) {
      console.debug('Received empty event when listening on pipeline configs - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === pipelineExecutionSuccessTopic) {
      this.pipelineExecutionEventHandler.handleSuccess(JSON.parse(msg.content.toString()))
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
