import { StorageHandler } from "./storageHandler"
import { Channel, connect, Connection } from "amqplib/callback_api"
import { TransformationEventInterface } from '../interfaces/transformationResults/transformationEventInterface';
import JSNotificationService from '../jsNotificationService';
import VM2SandboxExecutor from "../vm2SandboxExecutor";
import { CONFIG_TYPE } from "../models/notificationConfig";


export class AmqpHandler{
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
            await connect(rabit_amqp_url, function (error0: any, connection: Connection) {
                if (error0) {
                    console.error(`Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`);
                    return
                }
                established = true

                // create the channel
                AmqpHandler.initChannel(connection)
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

    private static initChannel(connection: any) {
            connection.createChannel(function (error1: Error, channel: any) {
                if (error1) {
                    throw error1;
                }

                channel.assertQueue(AmqpHandler.notifQueueName, {
                    durable: false,
                });

                // Consume from Channel
                console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", AmqpHandler.notifQueueName);
                channel.consume(AmqpHandler.notifQueueName, AmqpHandler.handleEvent,{noAck: true}
                );
            });
    }


    /**
     * Handles an event message
     * @param msg
     */
    private static handleEvent(msg: any): boolean {
        console.log(`Received Event from Channel: ${msg.content.toString()}`)

        const eventMessage = JSON.parse(msg.content.toString())
        const transformationEvent = eventMessage as TransformationEventInterface

        
        const isValid = AmqpHandler.isValidTransformationEvent(transformationEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        let handler = new StorageHandler()

        let configs = handler.getConfigsForPipeline(transformationEvent.pipelineID)
        let executor = new VM2SandboxExecutor()
        let notificationService = new JSNotificationService(executor)


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
    public static  isValidTransformationEvent(event: TransformationEventInterface): boolean {
        return !!event.dataLocation && !!event.pipelineID && !!event.pipelineName && !!event.jobResult
    }
}


