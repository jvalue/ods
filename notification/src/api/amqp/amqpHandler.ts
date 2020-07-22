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
    public async connect(retries: number, backoff: number) {
        console.log(`Connecting to AMQP broker un URL "${this.amqpUrl}"`)

        let established: boolean = false    // amqp service connection result
        const handler: AmqpHandler = this   // for ability to access methods and members in callback
        let errMsg: string = ''             // Error message to be shown after final retry

        for (let i = 1; i <= retries; i++) {
            await this.backOff(backoff)
            await AMQP.connect(rabit_amqp_url, async function (error0: any, connection: AMQP.Connection) {
                if (error0) {
                    errMsg = `Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`
                    console.info(`Connecting to Amqp handler (${i}/${retries})`);
                    return
                }
                established = true

                // create the channel
                await handler.initChannel(connection)
            })

            if (established) {
                break
            }
        }

        if (!established) {
            console.error(`Could not establish connection to Amqp handler: ${errMsg}`)
        } else {
            console.info('Connected to amqpHandler')
        }
    }

    /**
     * Waits for a specific time period.
     *
     * @param backOff   Period to wait in seconds
     */
    private backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    private async initChannel(connection: AMQP.Connection) {
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


