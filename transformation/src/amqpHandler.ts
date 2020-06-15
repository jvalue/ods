import { TransformationEvent } from './interfaces/transformationEvent';
import {   ConsumeMessage } from "amqplib";
import { Channel, connect, Connection} from "amqplib/callback_api"
import VM2SandboxExecutor from './vm2SandboxExecutor';
import { TransformationEventInterface } from './interfaces/transformationEventInterface'

export class AmqpHandler{
    static channel?: Channel           // notification channel
    static connection?: Connection
    static queueName = "test_queue"    // queue Name
    transformedDataMap : Map<number, object>     // Map, temporarily holding transformed data to evaluate


    /**
     * Default constructur
     */
    constructor() {
        this.transformedDataMap  = new Map()
    }

    /**
     * Stores transformed data to a Map temporarily until it gets evaluated by
     * notification conditions
     * 
     * @param pipelineID    Pipeline ID of the transformed data
     * @param data          data content to be later evaluated for conditions
     */
    public holdTransformedData(pipelineID: number,data: object): void{
        this.transformedDataMap.set(pipelineID,data)
    }

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

        var con = this.channel

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
                console.log("Connected to RabbitMQ.");
                
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
    
    /**
     * Initializes an event channel.
     * 
     * @param connection    Connection to the amqp (rabbitmq) service
     * 
     * @returns     initialized channel
     */
    private static initChannel(connection: Connection): void {
        
        connection.createChannel(function (err: any, channel: Channel) {
            if (err) {
                console.log('Filed to create Channel: ' + err)
                return
            }

            AmqpHandler.channel = channel

            AmqpHandler.channel.assertQueue(AmqpHandler.queueName, {
                durable: false,
            });

            // Consume from Channel
            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", AmqpHandler.queueName);
            //AmqpHandler.channel.consume(AmqpHandler.queueName, AmqpHandler.consumeEvents, { noAck: true });
        })
    }


    /**
     * Handles notification Event. This event contains the 
     * condtion to be evaluated.
     * 
     * @param msg
     * @returns true on successful handling of the event, else: false
     */
    private static consumeEvents(msg: ConsumeMessage | null): boolean {
        if (!msg) {
            console.warn('Could not receive Notification Event: Message is null')
            return false
        }

        // Extract content from Event
        const messageContent = msg.content.toString() 
        const transformationEvent = JSON.parse(messageContent) as TransformationEventInterface

        const isValid = this.isValidTransformationEvent(transformationEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

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
        Result:         ${transfromationEvent.result}`)

        const isValid = transfromationEvent.isValidTransformationEvent()

        if (!isValid) {
            console.error('Message to be sent is not an Transformation Event')
            return false
        }

        this.channel!.sendToQueue(this.queueName, Buffer.from(JSON.stringify(transfromationEvent)));
        console.log(" [x] Sent %s", transfromationEvent);

        this.channel!.assertQueue(this.queueName, {
              durable: false,
        });
    }

    /**
     * Sends the notification condition evaluation results
     */
    public sendEvaluationResults() {

        const executor = new VM2SandboxExecutor()

        // console.log(`NotificationRequest received for pipeline: ${notification.pipelineId}.`)
        // const conditionHolds = executor.evaluate(notification.condition, notification.data)
        // console.log('Condition is ' + conditionHolds)
        // if (!conditionHolds) { // no need to trigger notification
        //     return Promise.resolve()
        // }
    }


    /**
     * Checks if this event is a valid Transformation event,
     * by checking if all field variables exist and are set.
     *
     * @returns     true, if param event is a TransformationEvent, else false
     */
    public static isValidTransformationEvent(event: TransformationEventInterface): boolean {
        return !!event.dataLocation && !!event.pipelineID && !!event.pipelineName && !!event.result
    }

}
