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

    private dbConnection!: Connection | null


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
    public async init(retries: number, backoff: number): Promise<void> {
        console.debug('Initializing storageHandler.')
        const handler: StorageHandler = this

        this.dbConnection = await this.initConnection(retries, backoff)

        if (!this.dbConnection) {
            console.error('Could not initialize storageHandler.')
            return Promise.reject()
        }

        this.slackRepository = this.dbConnection.getRepository(SlackConfig);
        this.webhookRepository = this.dbConnection.getRepository(WebHookConfig);
        this.firebaseRepository = this.dbConnection.getRepository(FirebaseConfig);

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        return Promise.resolve()
    }

    /**
     * Initializes a Database Connection to the notification-db service (postgres)
     * by using the Environment letiables:
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
        let dbCon: null | Connection = null
        let connected: boolean = false

        // try to establish connection
        for (let i = 1; i <= retries; i++) {
            dbCon = await createConnection(this.connectionOptions).catch(() => { return null })
            if (!dbCon) {
                console.info(`Initiliazing database connection (${i}/${retries})`)
                await this.backOff(backoff);
            } else {
                connected = true
                break;
            }
        }

        if (!connected) {
            return Promise.reject("Connection to databse could not be established.")
        }

        console.info('Connected to notification config database sucessfully.')
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
        console.debug(`Getting ConfigSummary for Pipeline with id ${pipelineId}.`)
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

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

        console.debug(`Successfully got the all configs for pipeline with id ${pipelineId}`)
        return notificationSummary
    }

    /**
     * Deletes all configs in the database referring to given pipeline id.
     * If one of the deletions fails all changes will be rolled back. 
     * 
     * @param pipelineId Id of the pipeline to delete the configs for
     */
    public deleteConfigsForPipelineID(pipelineId: number): Promise<void> {
        console.debug(`Deleting all configs for pipeline id "${pipelineId}"`)  
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let condition = { "pipelineId": pipelineId }

        if (!this.dbConnection) {
            console.error(`Could not delete configs for pipeline id "${pipelineId}": Connection has not been established to config atabase`)
            return Promise.reject()
        }

        let transaction =this.dbConnection.transaction(async transactionalEntityManager => {
            await transactionalEntityManager.delete(SlackConfig, condition)    
            await transactionalEntityManager.delete(WebHookConfig, condition)    
            await transactionalEntityManager.delete(FirebaseConfig, condition)    
        }).catch(error => { console.error(`Could not delete Conifgs with pipelineId ${pipelineId}`)})
        
        return Promise.resolve()
    }

    /**
     * Gets all Slack Config from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Slack Configs for
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
    public async getSlackConfigs(pipelineId: number): Promise<SlackConfig[]> {
        console.debug(`Getting Slack Configs with pipelineId ${pipelineId} from Database`)
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        let slackConfigList: SlackConfig[] = []

        if (!this.slackRepository) {
            console.error('Could not get slack configs  for pipeline id "${pipelineId}": Slack repository not initialized.')
            return Promise.reject()
        }

        try {
            slackConfigList = await this.slackRepository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }

        console.debug(`Sucessfully got ${slackConfigList.length} Slack config(s) from Database`)
        return slackConfigList
    }

    /**
     * Gets all WebHook Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the WebHook Configs for
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
    public async getWebHookConfigs(pipelineId: number): Promise<WebHookConfig[]> {
        console.debug(`Getting WebHook Configs with pipelineId ${pipelineId} from Database`)

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        let webHookConfigs: WebHookConfig[] = []

        try {
            webHookConfigs = await this.webhookRepository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }

        console.debug(`Sucessfully got ${webHookConfigs.length} WebhookConfigs from Database`)
        return webHookConfigs
    }

    /**
     * Gets all Firebase Configs from the database for a specific pipeline id
     *
     * @param pipelineId    Pipeline ID to get the Firebase Configs for
     * @returns Promise, containing a list of Firebaseconfigs with given pipeline id
     */
    public async getFirebaseConfigs(pipelineId: number): Promise<FirebaseConfig[]> {
        console.debug(`Getting Firebase Configs with pipelineId ${pipelineId} from Database`)
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        let firebaseConfigs: FirebaseConfig[] = []

        try {
            firebaseConfigs = await this.firebaseRepository.find({ pipelineId: pipelineId })
        } catch (error) {
            Promise.reject(error)
        }

        console.debug(`Sucessfully got ${firebaseConfigs.length} Firebase configs from Database`)
        return firebaseConfigs
    }

    /**
     * Persists a webhook config (provided by argument) to the config database
     *
     * @param webhookConfig    webhook config to persist
     * @returns Promise, containing the stored webhook config
     */
    public saveWebhookConfig(webhookConfig: WebHookConfig): Promise<WebHookConfig> {
        console.debug('Saving Webhook config to database')
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        const config = this.webhookRepository.create(webhookConfig)

        let webhookPromise = this.webhookRepository.save(config)

        console.debug('Succesfully persisted webhook config.')
        return webhookPromise;
    }

    /**
     * Persists a fireslackbase config (provided by argument) to the config database
     *
     * @param slackConfig    slack config to persist
     * @returns Promise, containing the stored slack config
     */
    public saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>  {
        console.debug('Saving Slack config to database.')
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        const config = this.slackRepository.create(slackConfig)

        let slackPromise = this.slackRepository.save(config)

        console.debug('Successfully persisted slack config')
        return slackPromise;
    }

    /**
     * Persists a firebase config (provided by argument) to the config database
     * 
     * @param firebaseConfig    firebase config to persist
     * @returns Promise, containing the stored firebase config
     */
    public saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>  {
        console.debug('Saving firebase conifg to database')

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        const config = this.firebaseRepository.create(firebaseConfig)
        let firebasePromise = this.firebaseRepository.save(config)

        console.debug('Successfully persisted firebase config')
        return firebasePromise;
    }
    
    /**
     * Updates a Slack config for given id
     * 
     * @param id id for the config to be updated
     * @param slackConfig slack config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateSlackConfig(id: number, slackConfig: SlackConfig): Promise<UpdateResult>{
        console.debug('Updating slack config to database')

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let updatePromise = this.slackRepository.update(id, slackConfig)

        console.debug('Succesfully updated slack config')
        return updatePromise
    }

    /**
     * Updates a Webhook config for given id
     *
     * @param id id for the config to be updated
     * @param webhookConfig webhook config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateWebhookConfig(id: number, webhookConfig: WebHookConfig): Promise<UpdateResult> {
        console.debug('Updating webhook config to database')

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let updatePromise = this.webhookRepository.update(id, webhookConfig)

        console.debug('Succesfully updated webhook config')
        return updatePromise
    }

    /**
     * Updates a Firebase config for given id
     *
     * @param id id for the config to be updated
     * @param firebaseConfig firebase config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateFirebaseConfig(id: number, firebaseConfig: FirebaseConfig): Promise<UpdateResult>{
        console.debug('Updating firebase config to database')

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let updatePromise = this.firebaseRepository.update(id, firebaseConfig)

        console.debug('Succesfully updated firebase config')
        return updatePromise
    }


    /**
      * Deletes a Slack config for given id
      * 
      * @param id id for the config to be deleted
      * @returns result of the deletion execution
      */
    public deleteSlackConfig(id: number): Promise<DeleteResult> {
        console.debug(`Deleting slack config with id ${id}`)

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let deletePromise = this.slackRepository.delete(id)

        console.debug(`Successfully deleted slack config with id ${id}`)
        return deletePromise
    }

    /**
     * Deletes a Webhook config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteWebhookConfig(id: number): Promise<DeleteResult> {
        console.debug(`Deleting webhook config with id ${id}`)

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let deletePromise = this.webhookRepository.delete(id)

        console.debug(`Successfully deleted webhook config with id ${id}`)
        return deletePromise
        
    }

    /**
     * Deletes a Firebase config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteFirebaseConfig(id: number): Promise<DeleteResult> {
        console.debug(`Deleting firebase config with id ${id}`)

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let deletePromise = this.firebaseRepository.delete(id)

        console.debug(`Successfully deleted firebase config with id ${id}`)
        return deletePromise
    }

    /**
     * This function ensures that all objects are initialized 
     * for further interaction with the config database 
     * 
     * @returns true, if invariant correct, else false
     */
    private checkClassInvariant(): boolean {
        let result: boolean = true
        let msg: string[] = []

        
        if (!this.dbConnection) {
            msg.push('Config Database connection')
            result = false
        }

        if (!this.slackRepository) {
            msg.push('Slack config repository')
            result = false
        }

        if (!this.webhookRepository) {
            msg.push('Webhook config repository')
            result = false
        }

        if (!this.firebaseRepository) {
            msg.push('Firebase config repository.')
            result = false      
        }

        if (!result) {
            console.error(`Error the following member variables are not set: ${msg}`)
        }

       return result
    }
}
