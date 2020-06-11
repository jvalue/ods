import { Pool, Client } from "pg";
import { SlackConfig, WebHookConfig, FirebaseConfig } from './interfaces/notificationConfig';
import { json } from "body-parser";
import { NotificationConfigRequest } from './interfaces/notificationConfig';
import { Connection, ConnectionOptions, createConnection, getConnection } from 'typeorm';

/**=============================================================================================================
 * This class handles Requests to the Nofification Database 
 * in order to store and get Notification Configurations.
 *==============================================================================================================*/
export class StorageHandler {
    pool!: Pool;     // Client Pool for connecting to the postgres-db

    constructor() {
        this.initPool();
    }


    /**===========================================================================================
     * Initializes a Database Connection to the notification-db service (postgres)
     * by using the Environment variables:
     *          - PGHOST:       IP/hostname of the storage service 
     *          - PGPORT:       PORT        of the storage service
     *          - PGPASSWORD:   PASSWORD to connect to the stprage db
     *          - PGUSER:       USER     to connect to the storage db
     * 
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     * 
     * @returns     a Promise, containing either a Connection on success or null on failure
     *===========================================================================================*/
    public async initConnection(retries: number, backoff: number): Promise<Connection | null> {
        var dbCon: null | Connection = null
        var established : boolean = false

        const options: ConnectionOptions = {
            type: "postgres",
            host: process.env.PGHOST,
            port: +process.env.PGPORT!,
            username: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGUSER,
            synchronize: true,
            // logging: true,
            entities: [
                WebHookConfig,
                SlackConfig,
                FirebaseConfig
            ]
        }

        for (let i = 0; i < retries; i++) {
            dbCon = await createConnection(options).catch(() => { return null })
            
            if (!dbCon) {
                console.warn(`DB Connection could not be initialized. Retrying in ${backoff} seconds`)
                await this.backOff(backoff);
            } else {
                established = true
                break;
            }
        }
            
        if (established) {
            console.log('Connection established')
        } else {
            console.error('Connection could not be established.')
        }
            
        return dbCon
    }

    /**====================================================================
     * Waits for a specific time period
     * 
     * @param backOff   Period to wait in seconds
     *====================================================================*/
    private backOff(backOff: number) : Promise<void>{
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }
    /**===========================================================================================
     * Gets all Slack Config from the database for a specific pipeline id
     *============================================================================================*/
    public async getSlackConfigs(pipelineID: number) : Promise<SlackConfig[]|null> {
        var slackConfigList 
        
        // return null if id not set
        if (!pipelineID) {
            return null;
        }

        // Get Configs from Database 
        try {
            const repository = getConnection().getRepository(SlackConfig)
            slackConfigList = await repository.find({ pipelineId: pipelineID })
        } catch (error) {
            console.log(error)
            return null
        }

        return slackConfigList
        
    }

    /**===========================================================================================
     * Gets all WebHook Configs from the database for a specific pipeline id
     *============================================================================================*/
    public async getWebHookConfigs(pipelineID: number): Promise<WebHookConfig[] | null> {
        var webHookConfigs : WebHookConfig[]

        // return null if id not set
        if (!pipelineID) {
            return null;
        }

        // Get Configs from Database 
        try {
            const repository = getConnection().getRepository(WebHookConfig)
            webHookConfigs = await repository.find({ pipelineId: pipelineID })
        } catch (error) {
            console.log(error)
            return null
        }

        return webHookConfigs

    }

    /**===========================================================================================
     * Gets all Firebase Configs from the database for a specific pipeline id
     *============================================================================================*/
    public async getFirebaseConfigs(pipelineID: number): Promise<FirebaseConfig[] | null> {
        var firebaseConfig: FirebaseConfig[]

        // return null if id not set
        if (!pipelineID) {
            return null;
        }

        // Get Configs from Database 
        try {
            const repository = getConnection().getRepository(FirebaseConfig)
            firebaseConfig = await repository.find({ pipelineId: pipelineID })
        } catch (error) {
            console.log(error)
            return null
        }

        return firebaseConfig

    }
    /**===========================================================================================
     * Initializes the Client Pool for the connection to the
     * (notification-) postgres-db
     *============================================================================================*/
    private initPool() {
        this.pool = new Pool();
        
        // Check on Errors 
        this.pool.on("error", (err: Error) => {
            console.error("Unexpected error on idle client", err);
            process.exit(-1);
        });
    }
    /**==============================================================================================
     * Gets a NotificationConfig identified by pipelineID
     * from the notification-db
     *===============================================================================================*/
    getConfig(pipelineID: String): void {

        // const baseConfig = this.getBaseConf(pipelineID)

        // const tableName = baseConfig.type

        // const selectQuery =
        //     `SELECT * FROM  ${tableName}
        //     WHERE BASE_CONF = ${pipelineID}"`

        // /*--------------------------------------------------------
        //  * Execute the query
        //  *--------------------------------------------------------*/
        // const result = this.pool.query(selectQuery, (err: Error, result: any) => {
        //     // Error during Query
        //     if (err) {
        //         console.log(err.stack);
        //         return null;
        //     }

        //     // Iterate over the resultset
        //     for (var entry in result) {
        //         console.log(entry);
        //     }
        // })

        
        //this.pool.end();
        
    }
    
    // /**==============================================================================================
    //  * Gets a NotificationConfig identified by pipelineID
    //  * from the notification-db
    //  *===============================================================================================*/
    // persistConfig(notificationConfig: NotificationConfig): boolean {
    //     if (notificationConfig.pipelineId) {
    //         return this.updateConfig(notificationConfig);
    //     } else {
    //         return this.insertConfig(notificationConfig);
    //     }
    // }
    /**==============================================================================================
     * Inserts a NotificationConfig 
     * into the notification-db
     *===============================================================================================*/
    // insertConfig(NotificationConfig: NotificationConfig): boolean {
    //     const insertStmt =
    //         "INSERT INTO BASE_CONF (PIPELINE_NAME, PIPELINE_ID, DATA, DATA_LOCATION, CONDITION) " +
    //         "VALUES ($1, $2, $3, $4, $5)";

    //     this.pool.query(insertStmt, (err: Error, result: any) => {
    //         if (err) {
    //             console.log(err.stack)
    //             return false
    //         }
    //     })

    //     return true;
    // }
    /**==============================================================================================
     * Updates a NotificationConfig identified by pipeLineID
     * in the notification-db
     *===============================================================================================*/
    // updateConfig(notificationConfig: NotificationConfig): boolean { 
    //     const pipeLineID = notificationConfig.pipelineId

    //     const insertStmt =
    //         "UPDATE BASE_CONF (PIPELINE_NAME, PIPELINE_ID, DATA, DATA_LOCATION, CONDITION) " +
    //         "VALUES ($1, $2, $3, $4, $5)";
        
    //     this.pool.query(insertStmt, (err: Error, result: any) => {
    //         if (err) {
    //             console.error(err.stack)
    //             return false
    //         }
    //     });

    //     return true
    // }
    /**======================================================
    * Gets the Base Notification Config 
    * (= Config without specialised platform properties)
    *=======================================================*/
    // getBaseConf(pipeLineID: String): void {
    //     var notificationConfig: NotificationConfigRequest
        
    //     const selectQuery =
    //         "SELECT * FROM BASE_CONF " +
    //         'WHERE PIPELINE_ID = "' + pipeLineID + '"'

    //     const result = this.pool.query(selectQuery, (err: Error) => {
    //         // Error during Query
    //         if (err) {
    //             console.error(err.stack);
    //             return null;
    //         }
            
    //     });
        
    //     //notificationConfig = result as NotificationConfig
        
    //     // if (!notificationConfig)
    //     //     console.warn(`Base Notification Config with PIPELINE_ID ${pipeLineID} not found`)
        
    //     //return notificationConfig
    // }

    // /**=====================================================
    //  * Converts a NotificationConfigRequest (received by REST API) 
    //  * to Notification Config
    //  *======================================================*/
    // convertRequest2Config(request: NotificationConfigRequest): NotificationConfig{
        
    //     if (!request) {
    //         console.warn("Cannot convert NotifcationConfigRequest: request is empty.")
    //         return notificationConfig
    //     }

    //     switch(request.)
        
    // }
}