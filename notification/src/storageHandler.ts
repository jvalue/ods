import { SlackConfig, WebHookConfig, FirebaseConfig } from './interfaces/notificationConfig';
import { Connection, ConnectionOptions, createConnection, getConnection } from 'typeorm';

/**=============================================================================================================
 * This class handles Requests to the Nofification Database 
 * in order to store and get Notification Configurations.
 *==============================================================================================================*/
export class StorageHandler {

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
        var established: boolean = false

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
    private backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }
    /**===========================================================================================
     * Gets all Slack Config from the database for a specific pipeline id
     * 
     * @param pipelineID    Pipeline ID to get the Slack Configs for
     *============================================================================================*/
    public async getSlackConfigs(pipelineID: number): Promise<SlackConfig[] | null> {
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
     * 
     * @param pipelineID    Pipeline ID to get the WebHook Configs for
     *============================================================================================*/
    public async getWebHookConfigs(pipelineID: number): Promise<WebHookConfig[] | null> {
        var webHookConfigs: WebHookConfig[]

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
     * 
     * @param pipelineID    Pipeline ID to get the Firebase Configs for
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

    /**===============================================================
     * TODO: Document
     * 
     *===============================================================*/
    public saveWebhookConfig(webhookConfig: WebHookConfig): boolean{

        // Init Repository for WebHook Config
        console.debug("Init Repository")
        const postRepository = getConnection().getRepository(WebHookConfig)

        // create object from Body of the Request (=WebHookConfig)
        console.debug("Init Webhook config")
        
        webhookConfig = postRepository.create(webhookConfig)
        

        // persist the Config
        console.debug("Save WebHookConfig to Repository")
        postRepository.save(webhookConfig);
        console.log("Webhook config persisted")

        return true
    }

    public saveSlackConfig(): boolean {
        return true
    }

    public saveFirebaseConfig(): boolean {
        return false
    }
}