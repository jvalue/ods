import { SlackConfig, WebHookConfig, FirebaseConfig } from '../models/notificationConfig';
import { Connection, ConnectionOptions, createConnection, getConnection, Repository, UpdateResult, DeleteResult } from 'typeorm';
import { NotificationSummary} from '../interfaces/notificationSummary';
import { NotificationRepository } from '../interfaces/notificationRepository';

/**
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements NotificationRepository {

    slackRepository!: Repository<SlackConfig>
    webhookRepository!: Repository<WebHookConfig>
    firebaseRepository!: Repository<FirebaseConfig>

    private connectionOptions: ConnectionOptions = {
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


    /**
     * Initializes the components of the notifciation storage handler.
     * This is done by establishing a connection to the notication database 
     * and initiliazing a repository for the notification config
     * 
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     */
    public init(retries: number, backoff: number): void {
        console.log('Initializing storageHandler.')
        const handler :StorageHandler = this
        
        this.initConnection(retries, backoff).then(connection => {
            this.slackRepository = getConnection().getRepository(SlackConfig);
            this.webhookRepository = getConnection().getRepository(WebHookConfig);
            this.firebaseRepository = getConnection().getRepository(FirebaseConfig);

        }).catch(error => console.error('Could not initialize storageHandler.'))
    }

    /**
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
     */
    private async initConnection(retries: number, backoff: number): Promise<Connection|null> {
        var dbCon: null | Connection = null
        var connected: boolean = false

        // try to establish connection
        for (let i = 0; i < retries; i++) {
            dbCon = await createConnection(this.connectionOptions).catch(() => { return null })
            if (!dbCon) {
                console.info(`DB Connection could not be initialized. Retrying in ${backoff} seconds`)
                await this.backOff(backoff);
            } else {
                connected = true
                break;
            }
        }

        if (!connected) {
            return Promise.reject("Connection to databse could not be established.")
        }

        return Promise.resolve(dbCon)
    }

    /**
         * Waits for a specific time period (in seconds)
         *
         * @param backOff   Period to wait in seconds
        */
    private backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    /**
     * This function returns all available Configs in the Database for given pipeline id.
     * 
     * @param pipelineId    Id of the pipeline to search configs for
     * @returns Promise, containing NotificationSummary (config that contains all configs)
     */
    public async getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary> {
        console.log(`Getting ConfigSummary for Pipeline with id ${pipelineId}.`)

        // Get the configs for given pipeline id
        const slackConfigs = await this.getSlackConfigs(pipelineId)
        const webHookConfigs = await this.getWebHookConfigs(pipelineId)
        const firebaseConfig = await this.getFirebaseConfigs(pipelineId)

        // build the summary
        const notificationSummary = {
            "slack": slackConfigs,
            "webhook": webHookConfigs,
            "firebase": firebaseConfig
        }
        
        return notificationSummary
    }

    /**
     * Deletes all configs in the database referring to given pipeline id.
     * If one of the deletions fails all changes will be rolled back. 
     * 
     * @param pipelineId Id of the pipeline to delete the configs for
     */
    public deleteConfigsForPipelineID(pipelineId: number): void {
        console.log(`Deleting all configs for pipeline id "${pipelineId}"`)  
        
        let condition = { "pipelineId": pipelineId }

        getConnection().transaction(async transactionalEntityManager => {
            await transactionalEntityManager.delete(SlackConfig, condition)    
            await transactionalEntityManager.delete(WebHookConfig, condition)    
            await transactionalEntityManager.delete(FirebaseConfig, condition)    
        })
    
    }

    /**
     * Gets all Slack Config from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Slack Configs for
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
    public async getSlackConfigs(pipelineId: number): Promise<SlackConfig[]> {
        console.log(`Getting Slack Configs with pipelineId ${pipelineId} from Database`)
        var slackConfigList: SlackConfig[] = []

        try {
            slackConfigList = await this.slackRepository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${slackConfigList.length} Slack config(s) from Database`)
        return slackConfigList
    }

    /**
     * Gets all WebHook Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the WebHook Configs for
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
    public async getWebHookConfigs(pipelineId: number): Promise<WebHookConfig[]> {
        console.log(`Getting WebHook Configs with pipelineId ${pipelineId} from Database`)
        var webHookConfigs: WebHookConfig[] = []

        try {
            webHookConfigs = await this.webhookRepository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${webHookConfigs.length} WebhookConfigs from Database`)
        return webHookConfigs
    }

    /**
     * Gets all Firebase Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Firebase Configs for
     * @returns Promise, containing a list of Firebaseconfigs with given pipeline id
     */
    public async getFirebaseConfigs(pipelineId: number): Promise<FirebaseConfig[]> {
        console.log(`Getting Firebase Configs with pipelineId ${pipelineId} from Database`)
        var firebaseConfigs: FirebaseConfig[] = []

        try {
            firebaseConfigs = await this.firebaseRepository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }
        console.log(`Sucessfully got ${firebaseConfigs.length} Firebase configs from Database`)
        return firebaseConfigs
    }

    /**
     * Persists a webhook config (provided by argument) to the config database
     *
     * @param webhookConfig    webhook config to persist
     * @returns Promise, containing the stored webhook config
     */
    public saveWebhookConfig(webhookConfig: WebHookConfig): Promise<WebHookConfig> {
        webhookConfig = this.webhookRepository.create(webhookConfig)
        
        return this.webhookRepository.save(webhookConfig);
    }

    /**
     * Persists a fireslackbase config (provided by argument) to the config database
     *
     * @param slackConfig    slack config to persist
     * @returns Promise, containing the stored slack config
     */
    public saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>  {
        slackConfig = this.slackRepository.create(slackConfig)

        return this.slackRepository.save(slackConfig);
    }

    /**
     * Persists a firebase config (provided by argument) to the config database
     * 
     * @param firebaseConfig    firebase config to persist
     * @returns Promise, containing the stored firebase config
     */
    public saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>  {
        firebaseConfig = this.firebaseRepository.create(firebaseConfig)

        return this.firebaseRepository.save(firebaseConfig);
    }
    
    /**
     * Updates a Slack config for given id
     * 
     * @param id id for the config to be updated
     * @param slackConfig slack config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateSlackConfig(id : number, slackConfig: SlackConfig): Promise<UpdateResult>{
        return this.slackRepository.update(id, slackConfig)  
    }

    /**
     * Updates a Webhook config for given id
     *
     * @param id id for the config to be updated
     * @param webhookConfig webhook config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateWebhookConfig(id: number, webhookConfig: WebHookConfig): Promise<UpdateResult> {
        return this.webhookRepository.update(id,webhookConfig)
    }

    /**
     * Updates a Firebase config for given id
     *
     * @param id id for the config to be updated
     * @param firebaseConfig firebase config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateFirebaseConfig(id: number, firebaseConfig: FirebaseConfig): Promise<UpdateResult>{
        return this.firebaseRepository.update(id, firebaseConfig)
    }


    /**
      * Deletes a Slack config for given id
      * 
      * @param id id for the config to be deleted
      * @returns result of the deletion execution
      */
    public deleteSlackConfig(id: number): Promise<DeleteResult> {
        return this.slackRepository.delete(id)
    }

    /**
     * Deletes a Webhook config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteWebhookConfig(id: number): Promise<DeleteResult> {
        return this.webhookRepository.delete(id)
    }

    /**
     * Deletes a Firebase config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteFirebaseConfig(id: number): Promise<DeleteResult> {
        return this.firebaseRepository.delete(id)
    }


}
