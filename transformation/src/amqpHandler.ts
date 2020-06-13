import { TransformationEvent } from './interfaces/transformationEvent';
import { connect, Connection, Channel } from "amqplib";

export class AmqpHandler{
    channel?: Channel
    queueName = "test_queue"

    /**====================================================================================
     * Connects to Amqp Service and initializes a channel
     *====================================================================================*/
    public async connect(retries: number, backoff: number) {
        const rabbit_url = process.env.AMQP_SERVICE_HOST;
        const rabbit_usr = process.env.AMQP_SERVICE_USER;
        const rabbit_password = process.env.AMQP_SERVICE_PWD;
        const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;


        console.log("URL: " + rabit_amqp_url)

        var established: boolean = false

        for (let i = 0; i < retries; i++) {
            await this.backOff(backoff)

            connect(rabit_amqp_url, async (error0: Error, connection: Connection) => {
                if (error0) {
                    console.error(`Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`);
                    return
                }
                established = true
                console.log("Connected to RabbitMQ.");

                // create the channel
                await this.initChannel(connection)
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
    private backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    private async initChannel(connection: Connection): Promise<void> {
        this.channel = await connection.createChannel();
        this.channel.assertQueue(this.queueName, {
          durable: false,
        });

        // Consume from Channel
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", this.queueName);
        this.channel.consume(this.queueName, this.handleEvent,{noAck: true});

        return Promise.resolve();
    }


    /**
     * Handles an event message
     * @param msg
     */
    private handleEvent(msg: any): boolean {
        const transformationEvent = msg.content.toString() as TransformationEvent

        const isValid = this.isValidTransformationEvent(transformationEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        return true
    }

    public notifyNotificationService(transfromationEvent:TransformationEvent) {
        const isValid = this.isValidTransformationEvent(transfromationEvent)
        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        this.channel!.sendToQueue(this.queueName, Buffer.from(JSON.stringify(transfromationEvent)));
        console.log(" [x] Sent %s", transfromationEvent);

        this.channel!.assertQueue(this.queueName, {
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
    private isValidTransformationEvent(event: TransformationEvent) : boolean {
        return !!event.dataLocation && !!event.pipelineID && !!event.pipelineName && !!event.result
    }
}
