import { TransformationEvent } from './interfaces/transformationEvent';

export class AmqpHandler{
    static channel: any

    /**====================================================================================
     * Connects to Amqp Service and initializes a channel
     *====================================================================================*/
    public static async connect(retries: number, backoff: number) {
        const amqp = require("amqplib/callback_api");
        const rabbit_url = process.env.AMQP_SERVICE_HOST;
        const rabbit_usr = process.env.AMQP_SERVICE_USER;
        const rabbit_password = process.env.AMQP_SERVICE_PWD;

        const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;

        console.log("URL: " + rabit_amqp_url)

        var established: boolean = false
        

        for (let i = 0; i < retries; i++) {
            await this.backOff(backoff)

            amqp.connect(rabit_amqp_url, function (error0: Error, connection: any) {
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
                break
            }
        }
    }
    
    /**====================================================================
         * Waits for a specific time period
         * 
         * @param backOff   Period to wait in seconds
         *====================================================================*/
    private static backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    private static initChannel(connection: any) {
            this.channel = connection.createChannel(function (error1: Error, channel: any) {
                if (error1) {
                    throw error1;
                }

                var queue = "test_queue";

                channel.assertQueue(queue, {
                    durable: false,
                });

                // Consume from Channel
                console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
                channel.consume(queue, AmqpHandler.handleEvent,{noAck: true}
                );
            });
    }


    /**
     * Handles an event message 
     * @param msg 
     */
    private static handleEvent(msg: any) :boolean {
        const transformationEvent = msg.content.toString() as TransformationEvent

        const isValid = this.isValidTransformationEvent(transformationEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }
        
        return true
    }

    public static notifyNotificationService(transfromationEvent:TransformationEvent) {
        const queue = 'test_queue'

        const isValid = this.isValidTransformationEvent(transfromationEvent)

        
        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(transfromationEvent)));
        console.log(" [x] Sent %s", transfromationEvent);

        this.channel.assertQueue(queue, {
              durable: false,
        });
    }


    /**
     * Checks if parameter event is a Transformation event,
     * by checking if all field variables exist and are set.
     * 
     * @param event Transformation event to be checked for validity 
     * 
     * @returns     true, if param event is a TransformationEvent, else false
     */
    private static isValidTransformationEvent(event: TransformationEvent) : boolean {
        return !!event.dataLocation && !!event.pipelineID && !!event.pipelineName && !!event.result
    }
}
