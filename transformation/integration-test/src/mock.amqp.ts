import { Channel, Connection, connect, Message } from "amqplib/callback_api"
import { resolve } from "path";
import { on } from "process";



let notificationChannel!: Channel // notification channel
let adapterDataChannel:Channel            // Channel containing transformation Jobs
let odsDataChannel: Channel;      // Channel to publish transformed data to the storage service (CQRS)

let adapterQueueName = process.env.AMQP_JOB_QUEUE!                // Queue name of the Job Queue
let notifQueueName = process.env.AMQP_NOTIFICATION_QUEUE!     // Queue name of the Notification Queue
let odsDataQueueName = process.env.AMQP_ODSDATA_QUEUE!        // Queu name of the Ods Data Queue (Queue where transformed data is puslished)


/**
 * Connects to Amqp Service and initializes a channel
 *
 * @param retries   Number of retries to connect to the notification-config db
 * @param backoff   Time to wait until the next retry
 */
export async function initConnection(retries: number, backoff: number): Promise<Connection> {
    const rabbit_url = process.env.AMQP_SERVICE_HOST;
    const rabbit_usr = process.env.AMQP_SERVICE_USER;
    const rabbit_password = process.env.AMQP_SERVICE_PWD;
    const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;

    var established: boolean = false // indicator if the connection has been established
    let errMsg: string = '' // Error Message to be shown after final retry

    let connection!: Connection

    connection = await new Promise(async (resolve, reject) => {
        for (let i = 1; i <= retries; i++) {
            
            connect(rabit_amqp_url, async (error0: any, dbCon: any) => {
                if (error0) {
                    errMsg = `Error connecting to RabbitMQ: ${error0}.Retrying in ${backoff} seconds`
                    console.info(`Connecting to Amqp handler (${i}/${retries})`);
                    return
                }

                established = true
                
                // create the channels
                notificationChannel = await initNotificationChannel(dbCon)
                initAdapterDataChannel(dbCon)
                odsDataChannel = await initStorageChannel(dbCon)

                connection = dbCon
                resolve(connection)
            })

            await backOff(backoff)

            if (established) {
                break
            }
        }

            if (!established) {
                console.error(`Could not establish connection to Amqp Handler: ${errMsg}`)
            } else {
                console.info('Connected to amqpHandler')
            }

            return resolve(connection)
    })

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
async function initStorageChannel(connection: Connection): Promise<Channel> {
    console.log(`Connecting to channel "${odsDataQueueName}" to publish events for storage service`)

    if (!connection) {
        console.error(`Could not create Channel ${odsDataQueueName}: connection is undefined.`)
        return Promise.reject()
    }

    return new Promise((resolve, reject) => {
        connection.createChannel((err: any, channel: Channel) => {
            if (err) {
                console.log('Failed to create Channel: ' + err)
                return Promise.reject('Failed to create Channel: ' + err)
            }

            // Assign this channel
            odsDataChannel = channel

            // Make sure the Channel exists
            adapterDataChannel.assertQueue(odsDataQueueName, { durable: true });
            console.log(`Connecting to channel "${odsDataQueueName}" to publish events for notificaiton service`)
            resolve(channel)

        })
    })
    
}

/**
 * Initializes a Queue/Channel for the consumption of Job-Queries.
 * Events (=Jobs) will be consumed and handled with a transformation using
 * the Events contents.
 *
 * @param connection Connection to the AMQP Service (rabbitmq)
 */
function initAdapterDataChannel(connection: Connection): void {
    console.log(`Connecting to channel "${adapterQueueName}" to publish events for notificaiton service`)

    if (!connection) {
        console.error(`Could not create Channel ${adapterQueueName}: connection is undefined.`)
        return
    }

    connection.createChannel((err: any, channel: Channel) => {
        if (err) {
            console.log('Failed to create Channel: ' + err)
            return
        }

        // Assign this channel
        adapterDataChannel = channel
    

        // Make sure the Channel exists
        adapterDataChannel.assertQueue(adapterQueueName, {durable: true});
    })
    console.log(`Connecting to channel "${adapterQueueName}" to publish events for notificaiton service`)

}

/**
 * Initializes an event channel.
 *
 * @param connection    Connection to the amqp (rabbitmq) service
 *
 * @returns     initialized channel
 */
async function initNotificationChannel(connection: Connection): Promise<Channel> {
    console.log(`Connecting to channel "${notifQueueName}" to publish events for notificaiton service`)

    if (!connection) {
        console.error(`Could not create Channel ${notifQueueName}: connection is undefined.`)
        return Promise.reject()
    }

    return new Promise((resolve, reject) => {
    connection.createChannel((err: any, channel: Channel) => {
        if (err) {
            console.log('Filed to create Channel: ' + err)
            reject('Filed to create Channel: ' + err)
            return 
        }

        notificationChannel = channel
        notificationChannel.assertQueue(notifQueueName, { durable: true });
        
        resolve(channel)
    })
        console.log(`Successfully connected to channel "${notifQueueName}".`)
    })
}


/**
 * Sends a job to the adapterData channel that indicates that the import by the adapter service is done.
 *
 * @param odsDataEvent Event that contains information for the transformation service
 *
 * @returns true, if the Event has been successfully sent to the queue, else: false.
 */
export function publishAdapterEvent(odsDataEvent: object): void {
    // Make sure the Channel exists
    adapterDataChannel.assertQueue(adapterQueueName, {
        durable: true,
    });

    adapterDataChannel!.sendToQueue(adapterQueueName, Buffer.from(JSON.stringify(odsDataEvent)));
    console.log('Successfully sent transformation Event to notification queue.')
}


export function consumeFromNotificationChannel(callback: (event: object | null) => void): void{
    // notificationChannel.prefetch(1) //assure that only one event is consumed
    //notificationChannel.purgeQueue(notifQueueName)
    notificationChannel.consume(notifQueueName, (msg: Message | null) => {
        if (!msg) {
            callback(msg)
            return
        }
        const messageContent = msg.content.toString('utf-8')
        const transformationEvent = JSON.parse(messageContent) 
        callback(transformationEvent)
    }, {noAck : true})
}

export function consumeFromODSDataChannel(callback: (event: object | null) => void): void {
    //odsDataChannel.purgeQueue(odsDataQueueName)
    odsDataChannel.prefetch(1) //assure that only one event is consumed
    odsDataChannel.consume(odsDataQueueName, (msg: Message | null) => {
        if (!msg) {
            callback(msg)
            return
        }

        odsDataChannel.ackAll()
        const messageContent = msg.content.toString('utf-8')
        const dataEvent = JSON.parse(messageContent)
        callback(dataEvent)
        
    }, { noAck: true })
}

export async function consumeODSDataEvent(): Promise<object> {
    //odsDataChannel.purgeQueue(odsDataQueueName)
    // await new Promise((resolv, reject) => {
    //     odsDataChannel.close(err => {

    //         if (err)
    //             reject(err)
    //         resolv(err)
    //     })
        
    // })

    // odsDataChannel = await initStorageChannel(connection)

    // odsDataChannel.prefetch(1) //assure that only one event is consumed
    return new Promise((resolv, reject) => {
        odsDataChannel.consume(odsDataQueueName, (msg: Message | null) => {
            if (!msg) {
                reject(msg)
                return
            }

            // odsDataChannel.ackAll()
            const messageContent = msg.content.toString('utf-8')
            const dataEvent = JSON.parse(messageContent)

            console.warn(`Received ODS Data Event: ${messageContent}`)
            odsDataChannel.cancel(msg.fields.consumerTag!)  // Cancel consumption
            resolv(dataEvent)
        }, { noAck: true })
    })  
}


export async function consumeNotificationEvent(): Promise<object | null> {
    notificationChannel.prefetch(1) //assure that only one event is consumed
    //notificationChannel.purgeQueue(notifQueueName)
    return new Promise((resolv, reject) => {
        notificationChannel.consume(notifQueueName, (msg: Message | null) => {
            if (!msg) {
                resolv(msg)
                return
            }
            const messageContent = msg.content.toString('utf-8')
            const transformationEvent = JSON.parse(messageContent)

            notificationChannel.cancel(msg.fields.consumerTag!) // Cancel consumption

            resolv(transformationEvent)
        }, { noAck: true })
    })
}


/**
 * Getter for  the storage channel
 */
export function getODSDataChannel() {
    return odsDataChannel
}

/**
 * Gets the adapterDataChannel channel
 */
export function getAdapterDataChannel() {
    return adapterDataChannel
}

/**
 * Gets the notificaiton channel
 */
export function getNotificationChannel() {
    return notificationChannel
}

