import { StorageHandler } from "./storageHandler"
import { Channel, connect, Connection } from "amqplib/callback_api"
import { TransformationEvent } from '../interfaces/transformationResults/transformationEvent';
import JSNotificationService from '../jsNotificationService';
import VM2SandboxExecutor from "../vm2SandboxExecutor";
import { CONFIG_TYPE } from "../models/notificationConfig";

/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with this channels:
 *
 *      * Notification Channel:
 *       ----------------------
 *       A channel to notify the notification service that a transformation is done.
 *       (see TransformationEvent for details of the Event).
 *      
 */
export class AmqpHandler{
    notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE!     // Queue name of the Job Queue

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

        console.log("URL: " + rabit_amqp_url)

        var established: boolean = false    // amqp service connection result
        const handler: AmqpHandler = this   // for ability to access methods and members in callback
        let errMsg: string = ''             // Error Message to be shown after final retry
        
        for (let i = 1; i <= retries; i++) {
            await this.backOff(backoff)
            await connect(rabit_amqp_url, async function (error0: any, connection: Connection) {
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

    private initChannel(connection: any) {
        const handler: AmqpHandler = this   // for ability to access methods and members in callback

        connection.createChannel(function (error1: Error, channel: any) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(handler.notifQueueName, {
                durable: false,
            });

            // Consume from Channel
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", handler.notifQueueName);
            channel.consume(handler.notifQueueName, handler.handleEvent,{noAck: true}
            );
        });
    }

    /**
     * Handles an event message
     * @param msg
     * 
     * @returns true on success, else false
     */
    private handleEvent(msg: any): boolean {

        const eventMessage = JSON.parse(msg.content.toString())
        const transformationEvent = eventMessage as TransformationEvent

        console.log(`Received Event from Channel: Pipeline id: "${transformationEvent.pipelineId}", 
        Pipeline Name: "${transformationEvent.pipelineName}`)
        
        const isValid = this.isValidTransformationEvent(transformationEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        const handler = new StorageHandler()

        const configs = handler.getConfigsForPipeline(transformationEvent.pipelineId)
        const executor = new VM2SandboxExecutor()
        const notificationService = new JSNotificationService(executor)


        configs.then(config => {

            if (!config) {
                console.error('Could not get Config')
                return true
            }

            for (const webhookConfig of config.webhook) {
                notificationService.handleNotification(webhookConfig, transformationEvent, CONFIG_TYPE.WEBHOOK)
            }

            for (const slackConfig of config.slack) {
                notificationService.handleNotification(slackConfig, transformationEvent, CONFIG_TYPE.SLACK)
            }


            for (const firebaseConfig of config.firebase) {
                notificationService.handleNotification(firebaseConfig, transformationEvent, CONFIG_TYPE.FCM)
            }
            
        })

        return true
    }

    /**
        * Checks if this event is a valid Transformation event,
        * by checking if all field variables exist and are set.
        *
        * @returns     true, if param event is a TransformationEvent, else false
        */
    public  isValidTransformationEvent(event: TransformationEvent): boolean {
        return !!event.dataLocation && !!event.pipelineId && !!event.pipelineName && !!event.jobResult
    }
}


