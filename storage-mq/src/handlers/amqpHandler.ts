import { StorageHandler } from "./storageHandler"
import { connect, Connection, ConsumeMessage } from "amqplib/callback_api"
import { DataEvent, EVENT_TYPE, DDL_QUERY_TYPE, DataDDLEvent, DataDMLEvent, DML_QUERY_TYPE } from '../interfaces/dataEvent';

/**
 * This class handles the communication with the AMQP service (rabbitmq)
 * It interacts with this channels:
 *
 *      * ODS Data Channel:
 *       ----------------------
 *       A channel where CREATE, UPDATE, DELETE Operations of transformed data will be placed for 
 *       corresponding execution on the database
 *      
 */
export class AmqpHandler{
    odsDataQueueName = process.env.AMQP_ODSDATA_QUEUE!     // Queue name of "ODS DATA" queue

    storageHandler : StorageHandler

    /**
     * Default constructor.
     * 
     * @param storageHandler    StorageHandler to get corresponding notification configs
     */
    constructor(storageHandler : StorageHandler) {
        this.storageHandler = storageHandler
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
        console.log(`Initializing Transformation Channel "${this.odsDataQueueName}"`)
        const handler: AmqpHandler = this   // for ability to access methods and members in callback

        connection.createChannel(function (error1: Error, channel: any) {
            if (error1) {
                throw error1;
            }

            channel.assertQueue(handler.odsDataQueueName, {
                durable: false,
            });

            // Consume from Channel
            channel.consume(
                handler.odsDataQueueName,
                (msg: ConsumeMessage | null) => handler.handleEvent(msg),
                { noAck: true }
            );
        });
        console.info(`Successfully initialized Transformation Channel "${this.odsDataQueueName}"`)
    }

    /**
     * Handles an event message
     * @param msg Message receveived from the message queue
     * 
     * @returns true on success, else false
     */
    private handleEvent(msg: ConsumeMessage | null): boolean {
        if (!msg) {
            console.warn('Could not receive Notification Event: Message is not set')
            return false
        }

        const eventMessage = JSON.parse(msg.content.toString())
        const dataEvent = eventMessage as DataEvent

        console.log(`Received Event from Channel.`)
        
        const isValid = this.isValidDataEvent(dataEvent)

        if (!isValid) {
            console.error('Message received is not an Transformation Event')
            return false
        }

        

        switch (dataEvent.eventType) {
            /*===========================================================
             * Data DDL Event
             *=========================================================*/
            case EVENT_TYPE.DATA_DDL:

                const ddlEvent = dataEvent as DataDDLEvent

                switch (ddlEvent.ddlType) {

                    case DDL_QUERY_TYPE.CREATE_TABLE:
                        this.storageHandler.createDataTable(ddlEvent.tableName)
                        break
                    
                    case DDL_QUERY_TYPE.DROP_TABLE:
                        this.storageHandler.dropTable(ddlEvent.tableName)
                        break
                    
                    default:
                        console.warn(`Data Event Type ${dataEvent.eventType} not supported`)
                        break
                }

                break;
            
            /*===========================================================
            * Data DML Event
            *=========================================================*/
            case EVENT_TYPE.DATA_DML:
        
                const dmlEvent = dataEvent as DataDMLEvent
                const tableName = '' + dmlEvent.data.pipelineId

                switch (dmlEvent.dmlType) {
                    case DML_QUERY_TYPE.CREATE:
                        this.storageHandler.saveData(tableName, dmlEvent.data)
                        break
                    
                    case DML_QUERY_TYPE.UPDATE:
                        this.storageHandler.updateData(tableName, dmlEvent.data, { id: dmlEvent.data.id })
                        break
                    
                    case DML_QUERY_TYPE.DELETE:
                        this.storageHandler.deleteData(tableName, { id: dmlEvent.data.id })
                        break
                    
                    default:
                        console.warn(`Data Event Type "${dmlEvent.data.pipelineId}" not supported.`)
                        break

                }
        }
    
        return true
    }

    /**
        * Checks if this event is a valid Transformation event,
        * by checking if all field variables exist and are set.
        *
        * @returns     true, if param event is a TransformationEvent, else false
        */
    public  isValidDataEvent(event: DataEvent): boolean {
        return !!event && !!event.eventType
    }
}


