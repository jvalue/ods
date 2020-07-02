
import {   ConsumeMessage } from "amqplib";
import { Channel, connect, Connection} from "amqplib/callback_api"
import DatasourceConfig from '../interfaces/datasource-config';
import DatasourceEvent from "../interfaces/datasource-event";
import {  applyChanges } from "../scheduling";




/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with two channels:
 *
 *      * Notification Channel:
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see TransformationEvent for details of the Event)
 *
 *      * Job Channel:
 *       --------------
 *       A Channel for the consumption of Transformation Jobs.
 *       All Jobs for the transformation service will be consumed here.
 *       (see JobEvent for details of the Event)
 */
export class AmqpHandler {
    adapterTriggerChannel!: Channel                      // Channel containing transformation Jobs
    adapterConfigChannel!: Channel                  // Channel to publish transformed data to the storage service (CQRS)

    connection!: Connection                   // Connection to the AMQP Service (Rabbit MQ)

    adapterTriggerChannelName = process.env.AMQP_ADAPTER_TRIGGER_CHANNEL!     // Name of the queue for sending trigger Events to Adapter service
    adapterConfigChannelName = process.env.AMQP_ADAPTER_CONFIG_CHANNEL!                // Name of the queue for consuming adapter config changes (will be cached locally)

    adapterEndpoint = process.env.ADAPTER_SERVICE_URL   // Adapter service url to get data from


    /**
     * Connects to Amqp Service and initializes a channel
     *
     * @param retries   Number of retries to connect to the notification-config db
     * @param backoff   Time to wait until the next retry
     */
    public async connect(retries: number, backoff: number) {
        const rabbit_url = process.env.AMQP_SERVICE_HOST;
        const rabbit_usr = process.env.AMQP_SERVICE_USER;
        const rabbit_password = process.env.AMQP_SERVICE_PWD;
        const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;

        var established: boolean = false        // indicator if the connection has been established
        let errMsg: string = ''             // Error Message to be shown after final retry

        for (let i = 1; i <= retries; i++) {
            await this.backOff(backoff)
            await connect(rabit_amqp_url, async (error0: any, connection: Connection) => {
                if (error0) {
                    errMsg = `Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`
                    console.info(`Connecting to Amqp handler (${i}/${retries})`);
                    return
                }

                established = true

                // create the channels
                await this.initAdapterChannel(connection)
                await this.initConfigChangeChannel(connection)
            })

            if (established) {
                break
            }
        }

        if (!established) {
            console.error(`Could not establish connection to Amqp Handler: ${errMsg}`)
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


    /**
     * Initializes an event channel.
     *
     * @param connection    Connection to the amqp (rabbitmq) service
     *
     * @returns     initialized channel
     */
    private initAdapterChannel(connection: Connection): void {
        console.log(`Connecting to channel "${this.adapterTriggerChannelName}" to publish events for notificaiton service`)
        connection.createChannel((err: any, channel: Channel) => {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            this.adapterTriggerChannel = channel

            this.adapterTriggerChannel.assertQueue(this.adapterTriggerChannelName, {
                durable: true,
            });

        })
        console.log(`Successfully connected to channel "${this.adapterTriggerChannelName}".`)
    }


    /**
     * Initializes a Queue/Channel for consuming "config change" events from adapter service
     *
     * @param connection Connection to the AMQP Service (rabbitmq)
     */
    private initConfigChangeChannel(connection: Connection): void {
        console.log(`Connecting to channel "${this.adapterConfigChannel}" to receive "config change" events from adapter service`)
        connection.createChannel((err: any, channel: Channel) => {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            // Assign this channel
            this.adapterConfigChannel = channel

            // Make sure the Channel exists
            this.adapterTriggerChannel.assertQueue(this.adapterConfigChannelName, {
                durable: true,
            });

            // Consume from Channel
            this.adapterTriggerChannel.consume(
                this.adapterConfigChannelName,
                (msg: ConsumeMessage | null) => this.consumeConfigChangeEvent(msg),
                { noAck: true }
            );

        })
        console.log(`Connecting to channel "${this.adapterConfigChannelName}" to publish events for notificaiton service`)
    }


    /**
     * Handles Adapter Event. This event contains the
     * condtion to be evaluated.
     *
     * @param msg Message received from the queue
     * @returns true on successful handling of the event, else: false
     */
    private async consumeConfigChangeEvent(msg: ConsumeMessage | null): Promise<boolean> {
        console.log(`Received Message from data queue: ${msg?.content.toString()}`)
        if (!msg) {
            console.warn('Could not receive Notification Event: Message is null')
            return false
        }

        // Extract content from Event
        const messageContent = msg.content.toString()
        const datasourceEvent = JSON.parse(messageContent) as DatasourceEvent
        await applyChanges(datasourceEvent)

        return true
    }

    /**
     * Publishes a datasourceConfig to the adapter in order to trigger an exection
     * 
     * @param datasourceConfig config to be sent to the adapter service
     */
    public publishAdapterEvent(datasourceConfig: DatasourceConfig): boolean {
        console.log(`Publishing transformed data to the storage queue.`)

        this.adapterConfigChannel.sendToQueue(this.adapterTriggerChannelName, Buffer.from(JSON.stringify(datasourceConfig)));

        console.log(`Sucessfully published transformed data to the storage queue.`)
        return true
    }




    /**
     * Checks if this event is a valid DatasourceEvent event,
     * by checking if all field variables exist and are set.
     *
     * @param event DatasourceEvent, that has to be checked
     * @returns     true, if param event is a TransformationEvent, else false
     */
    public static isValidDatasourceEvent(event: DatasourceEvent): boolean {
        return !!event && !!event.eventId && !! event.datasourceId && !! event.eventType
    }

}
