import { TransformationEvent } from './interfaces/transformationEvent';
import {   ConsumeMessage } from "amqplib";
import { Channel, connect, Connection} from "amqplib/callback_api"
import { TransformationEventInterface } from './interfaces/transformationEventInterface'
import JobEvent from './interfaces/jobEvent';


/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with two channels:
 * 
 *      * Notification Channel:     
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see TransformationEventInterface for details of the Event)
 * 
 *      * Job Channel:
 *       --------------
 *       A Channel for the consumption of Transformation Jobs.
 *       All Jobs for the transformation service will be consumed here.
 *       (see JobEvent for details of the Event)
 */
export class AmqpHandler{
    static notificationChannel: Channel             // notification channel
    static jobChannel: Channel                      // Channel containing transformation Jobs

    static connection: Connection                   // Connection to the AMQP Service (Rabbit MQ)

    static jobQueueName = process.env.AMQP_JOB_QUEUE!                // Queue name of the Job Queue
    static notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE!     // Queue name of the Job Queue


    /**
     * Connects to Amqp Service and initializes a channel
     * 
     * @param retries   Number of retries to connect to the notification-config db
     * @param backoff   Time to wait until the next retry
     */
    public static async connect(retries: number, backoff: number) {
        const rabbit_url = process.env.AMQP_SERVICE_HOST;
        const rabbit_usr = process.env.AMQP_SERVICE_USER;
        const rabbit_password = process.env.AMQP_SERVICE_PWD;
        const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;

        console.log("URL: " + rabit_amqp_url)

        var established: boolean = false

        for (let i = 0; i < retries; i++) {
            await this.backOff(backoff)
            connect(rabit_amqp_url, function (error0: any, connection: Connection) {

                if (error0) {
                    console.error(`Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`);
                    return
                }

                established = true
                
                // create the channels
                AmqpHandler.initNotificationChannel(connection)
                AmqpHandler.initJobChannel(connection)
            })

            if (established) {
                console.log("Connected to RabbitMQ.");
                break
            }
        }
    }


    /**
     * Waits for a specific time period.
     *
     * @param backOff   Period to wait in seconds
     */
    private static backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }
    

    /**
     * Initializes an event channel.
     * 
     * @param connection    Connection to the amqp (rabbitmq) service
     * 
     * @returns     initialized channel
     */
    private static initNotificationChannel(connection: Connection): void {
        
        connection.createChannel(function (err: any, channel: Channel) {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            AmqpHandler.notificationChannel = channel

            AmqpHandler.notificationChannel.assertQueue(AmqpHandler.notifQueueName, {
                durable: false,
            });

            // // Consume from Channel
            // console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", AmqpHandler.notifQueueName);
            //AmqpHandler.channel.consume(AmqpHandler.queueName, AmqpHandler.consumeEvents, { noAck: true });
        })
    }


    /**
     * Initializes a Queue/Channel for the consumption of Job-Queries.
     * 
     * Events (=Jobs) will be consumed and handled with a transformation using 
     * the Events contents.
     * 
     * @param connection Connection to the AMQP Service (rabbitmq)
     */
    private static initJobChannel(connection: Connection): void {

        connection.createChannel(function (err: any, channel: Channel) {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            // Assign this channel
            AmqpHandler.jobChannel = channel

            // Make sure the Channel exists
            AmqpHandler.jobChannel.assertQueue(AmqpHandler.jobQueueName, {
                durable: false,
            });

            // Consume from Channel
            console.log(" [*] Waiting for Jobs in %s.", AmqpHandler.jobQueueName);
            AmqpHandler.jobChannel.consume(AmqpHandler.jobQueueName, AmqpHandler.consumeJobEvent, { noAck: true });
        })
    }


    /**
     * Handles notification Event. This event contains the 
     * condtion to be evaluated.
     * 
     * @param msg
     * @returns true on successful handling of the event, else: false
     */
    private static consumeJobEvent(msg: ConsumeMessage | null): boolean {
        if (!msg) {
            console.warn('Could not receive Notification Event: Message is null')
            return false
        }

        // Extract content from Event
        const messageContent = msg.content.toString() 
        const jobEvent = JSON.parse(messageContent) as JobEvent

        const isValid = this.isValidJobEvent(jobEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        this.handleJob(jobEvent)

        return true
    }


    /**
     * Sends a Notification that indicates that the transformation is done.
     * 
     * @param transfromationEvent Event that contains all information of the transformation.
     * 
     * @returns true, if the Event has been successfully sent to the queue, else: false.
     */
    public static notifyNotificationService(transfromationEvent: TransformationEvent) {
        console.log('Notifying notification service that Transformation is done.')
        console.debug(`Sending Transformation Event to queue: \n\
        Data Location:  ${transfromationEvent.dataLocation} \n\
        Pipeline ID:    ${transfromationEvent.pipelineID}\n\
        Pipeline Name:  ${transfromationEvent.pipelineName}\n\
        Result:         ${transfromationEvent.jobResult}`)

        const isValid = transfromationEvent.isValidTransformationEvent()

        if (!isValid) {
            console.error('Message to be sent is not an Transformation Event')
            return false
        }

        // Make sure the Channel exists
        AmqpHandler.notificationChannel.assertQueue(this.notifQueueName, {
            durable: false,
        });

        this.notificationChannel!.sendToQueue(this.notifQueueName, Buffer.from(JSON.stringify(transfromationEvent)));
        console.log(" [x] Sent %s", transfromationEvent);

        this.notificationChannel!.assertQueue(this.notifQueueName, {
              durable: false,
        });
    }


    /**
     * Handles the Execution of a Job.
     * 
     * All information of the job is provided within the JobEvent (argument)
     * 
     * @param jobEvent Job to be executed (Transformation)
     */
    public static handleJob(jobEvent: JobEvent) {
        // TODO: Implement the transformation Execution based on JobEvent
    }


    /**
     * Checks if this event is a valid Transformation event,
     * by checking if all field variables exist and are set.
     * 
     * @param event TransformationEvent that has to be checked
     * @returns     true, if param event is a TransformationEvent, else false
     */
    public static isValidTransformationEvent(event: TransformationEventInterface): boolean {
        return !!event.dataLocation && !!event.pipelineID && !!event.pipelineName && !!event.jobResult
    }


    /**
     * Checks if this event is a valid JobEvent event,
     * by checking if all field variables exist and are set.
     * 
     * @param event JobEvent, that has to be checked
     * @returns     true, if param event is a TransformationEvent, else false
     */
    public static isValidJobEvent(event: JobEvent) {
        return !!event.pipelineID && !! event.func && !!event.data
    }
}
