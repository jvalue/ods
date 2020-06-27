import { TransformationEvent } from '../interfaces/transformationEvent';
import {   ConsumeMessage } from "amqplib";
import { Channel, connect, Connection} from "amqplib/callback_api"
import JobEvent from '../interfaces/jobResult/jobEvent';
import TransformationService from '../interfaces/transformationService';
import JSTransformationService from '../jsTransformationService';
import { StorageHandler } from './storageHandler';
import { PipelineConfig } from '../models/PipelineConfig';
import axios from 'axios';
import JobResult from '@/interfaces/jobResult/jobResult';


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
    notificationChannel!: Channel             // notification channel
    jobChannel!: Channel                      // Channel containing transformation Jobs

    connection!: Connection                   // Connection to the AMQP Service (Rabbit MQ)

    jobQueueName = process.env.AMQP_JOB_QUEUE!                // Queue name of the Job Queue
    notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE!     // Queue name of the Job Queue

    transformationService: JSTransformationService
    storageHandler: StorageHandler
    /**
     * Default constructor
     * 
     * @param transformationService transformation service that executes transformations
     */
    constructor(storageHandler: StorageHandler, transformationService: JSTransformationService) {
        this.storageHandler = storageHandler
        this.transformationService = transformationService
    }

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
        const handler: AmqpHandler = this       // To call the functions in the callback
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

                // create the channels
                await handler.initNotificationChannel(connection)
                await handler.initJobChannel(connection)
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
    private initNotificationChannel(connection: Connection): void {
        connection.createChannel((err: any, channel: Channel) => {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            this.notificationChannel = channel

            this.notificationChannel.assertQueue(this.notifQueueName, {
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
    private initJobChannel(connection: Connection): void {
        connection.createChannel((err: any, channel: Channel) => {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            // Assign this channel
            this.jobChannel = channel

            // Make sure the Channel exists
            this.jobChannel.assertQueue(this.jobQueueName, {
                durable: false,
            });

            // Consume from Channel
            console.log(" [*] Waiting for Jobs in %s.", this.jobQueueName);
            this.jobChannel.consume(this.jobQueueName, this.consumeJobEvent, { noAck: true });
        })
    }


    /**
     * Handles notification Event. This event contains the
     * condtion to be evaluated.
     *
     * @param msg
     * @returns true on successful handling of the event, else: false
     */
    private consumeJobEvent(msg: ConsumeMessage | null): boolean {
        if (!msg) {
            console.warn('Could not receive Notification Event: Message is null')
            return false
        }

        // Extract content from Event
        const messageContent = msg.content.toString()
        const jobEvent = JSON.parse(messageContent) as JobEvent

        if (!this.isValidJobEvent(jobEvent)) {
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
    public notifyNotificationService(transfromationEvent: TransformationEvent) {
        console.log('Notifying notification service that Transformation is done.')
        console.debug(`Sending Transformation Event to queue: \n\
        Data Location:  ${transfromationEvent.dataLocation} \n\
        Pipeline ID:    ${transfromationEvent.pipelineId}\n\
        Pipeline Name:  ${transfromationEvent.pipelineName}\n\
        Result:         ${transfromationEvent.jobResult}`)

        if (!this.isValidTransformationEvent(transfromationEvent)) {
            console.error('Message to be sent is not an Transformation Event')
            return false
        }

        // Make sure the Channel exists
        this.notificationChannel.assertQueue(this.notifQueueName, {
            durable: false,
        });

        this.notificationChannel!.sendToQueue(this.notifQueueName, Buffer.from(JSON.stringify(transfromationEvent)));
        console.log(" [x] Sent %s", transfromationEvent);

        this.notificationChannel!.assertQueue(this.notifQueueName, {
            durable: false,
        });
    }


    /**
     * Handles the Execution of a transformation job.
     *
     * All information of the job is provided within the JobEvent (argument)
     *
     * @param jobEvent Job to be executed (Transformation)
     */
    private async handleJob(jobEvent: JobEvent) {
        if (!this.isValidJobEvent(jobEvent)) {
            console.error("Cannot handle Job: given JobEvent is not valid")
            return
        }
        const pipelineConfigs = await this.storageHandler.getAllConfigs({ datasourceId: jobEvent.dataLocation })

        if (!pipelineConfigs) {
            console.log(`No PipelineConfigs found for adapter data with datasource id ${jobEvent.dataLocation}`)
            return
        }

        let adapterData: Object     // Data to transform (origin: adapter service)


        // Fat Event
        if (jobEvent.data) {
            adapterData = jobEvent.data
            // Thin Event
        } else if (jobEvent.dataLocation) {
            adapterData = await axios.get(jobEvent.dataLocation)

            // No Data set (--> Ignore Transformation)
        } else {
            console.error(`Data cannot be transformed: No Data on queue and no reference to data given by event.`)
            return
        }

        // Iterate over all Pipeline Configs, referring to the datasourceId
        for (let config of pipelineConfigs) {

            // Execute transformation
            const transformationCode = config.transformation.func
            let jobResult = this.transformationService.executeJob(transformationCode, adapterData)

            // Send Event to Notificaiton Service
            let transformationEvent = this.generateTransformationEvent(config, jobResult)
            this.notifyNotificationService(transformationEvent)
            console.log('Fetching successful.')
        }
    }

    /**
     * Generates a transformation event that is sent to the notification service 
     * after transformation execution.
     * 
     * @param config pipelineConfig, containing information about pipeline
     * @param jobeResult result of the transformation execution
     */
    private generateTransformationEvent(config: PipelineConfig, jobeResult: JobResult): TransformationEvent {
        // Initialize transformationEvent (to be sent to Notification Queue)
        const transformationEvent: TransformationEvent = {
            "pipelineId": config.id,
            "pipelineName": config.metadata.displayName,
            "dataLocation": ''+config.datasourceId,
            "jobResult": jobeResult
        }

        return transformationEvent
    }




    /**
     * Checks if this event is a valid Transformation event,
     * by checking if all field variables exist and are set.
     *
     * @param event TransformationEvent that has to be checked
     * @returns     true, if param event is a TransformationEvent, else false
     */
    private isValidTransformationEvent(event: TransformationEvent): boolean {
        return !!event.dataLocation && !!event.pipelineId && !!event.pipelineName && !!event.jobResult
    }


    /**
     * Checks if this event is a valid JobEvent event,
     * by checking if all field variables exist and are set.
     *
     * @param event JobEvent, that has to be checked
     * @returns     true, if param event is a TransformationEvent, else false
     */
    private isValidJobEvent(event: JobEvent): boolean {
        return !!event.data && !! !!event.dataLocation && !! !!event.pipelineId
    }

}
