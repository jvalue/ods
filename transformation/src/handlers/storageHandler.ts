import { Connection, ConnectionOptions, createConnection, getConnection, Repository, DeleteResult, UpdateResult } from 'typeorm';
import { TransformationConfig } from '../models/TransormationConfig';
import { TransformationRepository } from '../interfaces/transformationRepository';


/**
 * This class handles Requests to the Nofification Database 
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements TransformationRepository{

    private configRepository!: Repository<TransformationConfig>
    private dbConnection!: Connection | null

    /**
     * Initializes the components of the notifciation storage handler.
     * This is done by establishing a connection to the notication database 
     * and initiliazing a repository for the notification config
     * 
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     */
    public async init(retries: number, backoff: number): Promise<void> {
        console.log('Initializing storageHandler.')
        const handler: StorageHandler = this

        this.dbConnection = await this.initConnection(retries, backoff)
        
        if (!this.dbConnection) {
            console.error('Could not initialize storageHandler.')
            return Promise.reject()
        }
        this.configRepository = this.dbConnection.getRepository(TransformationConfig); 

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }
        return Promise.resolve()
    }


    /**
     * Initializes a Database Connection to the notification-db service (postgres)
     * by using the Environment constiables:
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
    private async initConnection(retries: number, backoff: number): Promise<Connection | null> {
        console.debug('Trying to establish connection to config database')
        let dbCon: null | Connection = null
        let established: boolean = false
        /*=================================================================
        * Get connection Options from Environment constiables
        *=================================================================*/
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
                TransformationConfig
            ]
        }
        /*=================================================================
         * try to connect to the notification-db service (<retries> times)
         *=================================================================*/
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
        /*=================================================================
        * Check for Connection Result
        *=================================================================*/
        if (established) {
            console.log('Connection established')
        } else {
            console.error('Connection could not be established.')
        }

        return dbCon
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
    * Gets all Transfromation Configs from the database for a specific pipeline id
    * 
    * @param pipelineID    Pipeline ID to get the Transfromation Configs for
    */
    public async getTransformationConfigs(pipelineID: number): Promise<TransformationConfig[] | null> {
        console.debug(`Getting Transformation Configs with pipelineId ${pipelineID} from Database`)
        
        if (!this.checkClassInvariant()) {
            Promise.reject()
        }
        let transformationConfigs: TransformationConfig[]

        // return null if id not set
        if (!pipelineID) {
            return null;
        }

        // Get Configs from Database 
        try {
            transformationConfigs = await this.configRepository.find({ pipelineId: pipelineID })
        } catch (error) {
            console.log(error)
            return null
        }

        console.debug(`Sucessfully got ${transformationConfigs.length} Transformation configs from Database`)
        return transformationConfigs
    }

    /**
     * Persists a transformation config (provided by argument) to the config database
     *
     * @param transformationConfig    transformation config to persist
     * @returns Promise, containing the stored transformation config
     */
    public saveTransformationConfig(transformationConfig: TransformationConfig): Promise<TransformationConfig>{
        console.debug(`Saving tranformation config.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }
        
        // create object from Body of the Request (=TransformationConfig)
        transformationConfig = this.configRepository.create(transformationConfig)
        // persist the Config
        let saveResult = this.configRepository.save(transformationConfig);

        console.debug("Webhook config persisted")
        return saveResult
    }

    /**
     * Deletes a Transformation config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteTransformationConfig(id: number): Promise<DeleteResult> {
        console.debug(`Deleting conifg with id ${id}.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        let deletePromise = this.configRepository.delete(id)

        console.debug(`Successfully deleted config with id ${id}`)
        return deletePromise
    }

 
    /**
     * Deletes all configs in the database referring to given pipeline id.
     * Currently only one config exists for given Pipeline ID.
     * 
     * @param pipelineId Id of the pipeline to delete the configs for
     * @returns Promise, containing the results of the deletion execution
     */
    public deleteConfigsForPipelineID(pipelineId: number): Promise<DeleteResult> {
        console.debug(`Deleting all configs for pipeline id "${pipelineId}"`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        let condition = { "pipelineId": pipelineId }

        this.checkClassInvariant

        return this.configRepository.delete(condition)
    }

    /**
     * Updates a Transformation config for given id
     *
     * @param id id for the config to be updated
     * @param transformationConfig Transformation config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateTransoformationConfig(id: number, transformationConfig: TransformationConfig): Promise<UpdateResult> {
        console.debug(`Updating config with id ${id}.`)
        if(!this.checkClassInvariant()){     Promise.reject()}

        let updatePromise = this.configRepository.update(id, transformationConfig)

        console.debug(`Successfully updated config with id ${id}`)

        return updatePromise
    }


    /**
     * Updates config for given pipelineId with the Transformation config, provided by argument config
     * Currently only one config exists for given Pipeline ID.
     *
     * @param pipelineId pipeline id, the config is updated for
     * @param config config that gets written in the database
     * @returns Promise, containing the results of the update execution
     */
    public updateConfigForPipelineID(pipelineId: number, config: TransformationConfig): Promise<UpdateResult> {
        const condition = {"pipelineId": pipelineId}
        return this.configRepository.update(condition,config)
    }

    /**
     * This function ensures that all objects are initialized 
     * for further interaction with the config database 
     * 
     * @returns true if invariant correct, else false
     */
    private checkClassInvariant(): boolean {
        let result: boolean = true
        let msg: string[] = []


        if (!this.dbConnection) {
            msg.push('Config Database connection')
            result = false
        }

        if (!this.configRepository) {
            msg.push('Transformation config repository')
            result = false
        }

        if (!result) {
           console.error(`Error the following member variables are not set: ${msg}`)
        }

        return result
    }

}