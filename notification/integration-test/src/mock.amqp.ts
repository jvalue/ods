import { Channel, Connection, connect,  } from "amqplib/callback_api"



let notificationChannel!: Channel // notification channel
let notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE! // Queue name of the Notification Queue

    /**
     * Connects to Amqp Service and initializes a channel
     *
     * @param retries   Number of retries to connect to the notification-config db
     * @param backoff   Time to wait until the next retry
     */
    export async function initConnection(retries: number, backoff: number) {
        const rabbit_url = process.env.AMQP_SERVICE_HOST;
        const rabbit_usr = process.env.AMQP_SERVICE_USER;
        const rabbit_password = process.env.AMQP_SERVICE_PWD;
        const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;

        var established: boolean = false // indicator if the connection has been established
        let errMsg: string = '' // Error Message to be shown after final retry

        let connection!: Connection

        for (let i = 1; i <= retries; i++) {
            await backOff(backoff)
            connect(rabit_amqp_url, (error0: any, dbCon: any) => {
                if (error0) {
                    errMsg = `Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`;
                    return;
                }

                established = true;
                initNotificationChannel(dbCon);

                connection = dbCon;
            })

            if (established) {
                break
            }
        }

        if (!established) {
            console.error(`Could not establish connection to Amqp Handler: ${errMsg}`)
        }
        return connection
    }


/**
 * Waits for a specific time period.
 *
 * @param backOff   Period to wait in seconds
 */
function backOff(backOff: number): Promise < void > {
    return new Promise(resolve => setTimeout(resolve, backOff * 1000));
}


/**
 * Initializes an event channel.
 *
 * @param connection    Connection to the amqp (rabbitmq) service
 *
 * @returns     initialized channel
 */
async function  initNotificationChannel(connection: Connection): Promise<void> {
    
    connection.createChannel((err: any, channel: Channel) => {
        if (err) {
            console.error('Filed to create Channel: ' + err);
            return;
        }

        notificationChannel = channel;

        notificationChannel.assertQueue(notifQueueName, {
            durable: true,
        });

    })
    
    return Promise.resolve()
}


/**
 * Sends a Notification that indicates that the transformation is done.
 *
 * @param transfromationEvent Event that contains all information of the transformation.
 *
 * @returns true, if the Event has been successfully sent to the queue, else: false.
 */
export function publishEvent(transfromationEvent: object): void {
    // Make sure the Channel exists
    notificationChannel.assertQueue(notifQueueName, {
        durable: true,
    });

    notificationChannel!.sendToQueue(notifQueueName, Buffer.from(JSON.stringify(transfromationEvent)));

}