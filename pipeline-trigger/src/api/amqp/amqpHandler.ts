import * as AMQP from 'amqplib'
import {
  AMQP_URL,
  AMQP_EXCHANGE,
  AMQP_PIPELINE_TRIGGER_QUEUE,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
} from '../../env'
import { sleep } from '../../sleep'
import { PipelineExecutor } from '../../pipeline-executor/pipeline-executor'

/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with these channels:
 *
 *      * Notification Channel:
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see PipelineEvent for details of the event).
 *
 */
export class AmqpHandler {
  constructor (private readonly pipelineExecutor: PipelineExecutor) { }
  /**
     * Connects to Amqp Service and initializes a channel
     *
     * @param retries   Number of retries to connect to the notification-config db
     * @param ms   Time to wait until the next retry
     */
  public async connect (retries: number, ms: number): Promise<void> {
    console.log(`Connecting to AMQP broker un URL "${AMQP_URL}"`)

    let retry = 1
    while (retry < retries) {
      try {
        console.log('Attempting to connect to AMQP Broker.')
        const connection = await AMQP.connect(AMQP_URL)
        console.log('Connected to AMQP Broker.')
        return await this.initChannel(connection)
      } catch (e) {
        retry++
        await sleep(ms)
      }
    }
    console.error('Could not connect to AMQP Broker')
    throw new Error('Could not connect to AMQP Broker')
  }

  private async initChannel (connection: AMQP.Connection): Promise<void> {
    console.log(`Initializing transformation channel "${AMQP_PIPELINE_TRIGGER_QUEUE}"`)

    const channel = await connection.createChannel()
    await channel.assertExchange(AMQP_EXCHANGE, 'topic')

    const q = await channel.assertQueue(AMQP_PIPELINE_TRIGGER_QUEUE, {
      exclusive: false
    })

    await channel.bindQueue(q.queue, AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)
    await channel.consume(q.queue, msg => {
      this.handleEvent(msg)
        .catch(error => console.error(`Failed to handle ${msg?.fields.routingKey ?? 'null'} event`, error))
    })

    console.info(
      `Successfully initialized pipeline-executed queue "${AMQP_PIPELINE_TRIGGER_QUEUE}" ` +
      `on topic "${AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC}"`
    )
  }

  private readonly handleEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on pipeline executions - doing nothing')
      return
    }
    console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString())
    if (msg.fields.routingKey === AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC) {
      const pipelineSuccessEvent = JSON.parse(msg.content.toString())
      this.pipelineExecutor.signalImportSuccesful(pipelineSuccessEvent.pipelineId, pipelineSuccessEvent.data)
    } else {
      console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
    }
  }
}
