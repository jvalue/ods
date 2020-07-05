import { Channel, Connection, connect } from "amqplib/callback_api"



let notificationChannel!: Channel // notification channel
let jobChannel                 // Channel containing transformation Jobs
let odsDataChannel              // Channel to publish transformed data to the storage service (CQRS)

let jobQueueName = process.env.AMQP_JOB_QUEUE!                // Queue name of the Job Queue
let notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE!     // Queue name of the Notification Queue
let odsDataQueueName = process.env.AMQP_ODSDATA_QUEUE!        // Queu name of the Ods Data Queue (Queue where transformed data is puslished)

let adapterEndpoint = process.env.ADAPTER_SERVICE_URL   // Adapter service url to get data from
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
            await connect(rabit_amqp_url, async(error0: any, dbCon: any) => {
                if (error0) {
                    errMsg = `Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`
                    console.info(`Connecting to Amqp handler (${i}/${retries})`);
                    return
                }

                established = true
               
                // create the channels
                await initNotificationChannel(connection)
                await initJobChannel(connection)
                await initODSDataChannel(connection)

                connection = dbCon
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
 * Initializes a Queue/Channel for publishing transformed data for the storage service.
 * Events (see odsDataEvents.ts).
 *
 * @param connection Connection to the AMQP Service (rabbitmq)
 */
function initODSDataChannel(connection: Connection): void {
    console.log(`Connecting to channel "${odsDataQueueName}" to publish events for storage service`)
    connection.createChannel((err: any, channel: Channel) => {
    if (err) {
        console.log('Filed to create Channel: ' + err)
        return
    }

    // Assign this channel
    odsDataChannel = channel

    // Make sure the Channel exists
    jobChannel.assertQueue(jobQueueName, {durable: true });

})
    console.log(`Connecting to channel "${jobQueueName}" to publish events for notificaiton service`)
}

/**
 * Initializes a Queue/Channel for the consumption of Job-Queries.
 * Events (=Jobs) will be consumed and handled with a transformation using
 * the Events contents.
 *
 * @param connection Connection to the AMQP Service (rabbitmq)
 */
function initJobChannel(connection: Connection): void {
    console.log(`Connecting to channel "${jobQueueName}" to publish events for notificaiton service`)
    connection.createChannel((err: any, channel: Channel) => {
        if (err) {
            console.log('Filed to create Channel: ' + err)
            return
        }

        // Assign this channel
        jobChannel = channel

        // Make sure the Channel exists
        jobChannel.assertQueue(jobQueueName, {durable: true});
    })
    console.log(`Connecting to channel "${jobQueueName}" to publish events for notificaiton service`)
}

/**
 * Initializes an event channel.
 *
 * @param connection    Connection to the amqp (rabbitmq) service
 *
 * @returns     initialized channel
 */
function initNotificationChannel(connection: Connection): void {
    console.log(`Connecting to channel "${notifQueueName}" to publish events for notificaiton service`)
    connection.createChannel((err: any, channel: Channel) => {
        if (err) {
            console.log('Filed to create Channel: ' + err)
            return
        }

        notificationChannel = channel

        notificationChannel.assertQueue(notifQueueName, {durable: true});

    })
    console.log(`Successfully connected to channel "${notifQueueName}".`)
}


/**
 * Sends a Notification that indicates that the transformation is done.
 *
 * @param transfromationEvent Event that contains all information of the transformation.
 *
 * @returns true, if the Event has been successfully sent to the queue, else: false.
 */
export function publishAdapterEvent(transfromationEvent: object): void {
    // Make sure the Channel exists
    notificationChannel.assertQueue(notifQueueName, {
        durable: true,
    });

    notificationChannel!.sendToQueue(notifQueueName, Buffer.from(JSON.stringify(transfromationEvent)));
    console.log('Successfully sent transformation Event to notification queue.')

    notificationChannel!.assertQueue(notifQueueName, {
        durable: true,
    });
}