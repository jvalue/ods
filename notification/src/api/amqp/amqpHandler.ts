import * as AMQP from "amqplib"
import { TriggerEventHandler } from "../triggerEventHandler";
import { TransformationEvent } from '../transformationEvent';

/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with these channels:
 *
 *      * Notification Channel:
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see TransformationEvent for details of the event).
 *
 */
export class AmqpHandler{
    amqpUrl = process.env.AMQP_URL!
    exchange = process.env.AMQP_PIPELINE_EXECUTION_EXCHANGE!
    transformationExecutedQueue = process.env.AMQP_PIPELINE_EXECUTION_QUEUE!
    transformationExecutedTopic = process.env.AMQP_PIPELINE_EXECUTION_TOPIC!
    transformationExecutionSuccessTopic = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC!

    triggerEventHandler: TriggerEventHandler

    constructor(triggerEventHandler: TriggerEventHandler) {
        this.triggerEventHandler = triggerEventHandler
    }

    /**
     * Connects to Amqp Service and initializes a channel
     *
     * @param retries   Number of retries to connect to the notification-config db
     * @param backoff   Time to wait until the next retry
     */
    public async connect(retries: number, backoff: number): Promise<void> {
        console.log(`Connecting to AMQP broker un URL "${this.amqpUrl}"`)

        let retry = 0
        while(retry < retries) {
            try {
                console.log("Attempting to connect to AMQP Broker.")
                const connection = await AMQP.connect(this.amqpUrl)
                console.log("Connected to AMQP Broker.")
                return await this.initChannel(connection)
            } catch (e) {
                retry ++
                await this.backOff(backoff)
            }
        }
        console.log("Could not connect to AMQP Broker!")
        return Promise.reject()
    }

    /**
     * Waits for a specific time period.
     *
     * @param ms   Period to wait in seconds
     */
    private backOff(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async initChannel(connection: AMQP.Connection): Promise<void> {
        console.log(`Initializing transformation channel "${this.transformationExecutedQueue}"`)

        const channel = await connection.createChannel()
        channel.assertExchange(this.exchange, 'topic', {
          durable: false
        });

        const q = await channel.assertQueue(this.transformationExecutedQueue, {
            exclusive: false
        })

        channel.bindQueue(q.queue, this.exchange, this.transformationExecutedTopic);
        channel.consume(q.queue, async (msg: AMQP.ConsumeMessage | null) => await this.handleEvent(msg))

        console.info(`Successfully initialized pipeline-executed queue "${this.transformationExecutedQueue}" on topic "${this.transformationExecutedTopic}"`)
        return Promise.resolve()
    }

    private async handleEvent(msg: AMQP.ConsumeMessage | null): Promise<void> {
      if(!msg) {
        console.debug("Received empty event when listening on pipeline executions - doing nothing")
        return
      }
      console.debug("[ConsumingEvent] %s:'%s'", msg.fields.routingKey, msg.content.toString());
      if(msg.fields.routingKey === this.transformationExecutionSuccessTopic) {
          this.triggerEventHandler.handleEvent(JSON.parse(msg.content.toString()))
      } else {
        console.debug("Received unsubscribed event on topic %s - doing nothing", msg.fields.routingKey);
      }
    }
}


