import { Connection, ConnectionOptions, createConnection, getConnection, Repository, DeleteResult, UpdateResult, FindConditions } from 'typeorm';
import { TransformationConfig } from '../models/TransformationConfig';
import { TransformationRepository } from '../interfaces/transformationRepository';
import { PipelineMetaData } from '../models/PipelineMetaData';
import TransformationData from '../models/TransformationData';



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
        let errMsg : string = ''
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
                TransformationConfig,
                PipelineMetaData,
                TransformationData
            ]
        }
        /*=================================================================
         * try to connect to the notification-db service (<retries> times)
         *=================================================================*/
        for (let i = 1; i <= retries; i++) {
            console.log(`Trying to establish Database Connection (${i}/${retries})`)
            dbCon = await createConnection(options).catch((err: Error) => {
                errMsg = err.message
                return null
            })

            if (!dbCon) {
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
            console.info('Connected to database.')
        } else {
            console.error(`Connection could not be established: ${errMsg}`)
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
    * @param pipelineId Pipeline ID to get the Transfromation Configs for
    * @param query      object, containing additional condtitions for the database query
    * @returns          null on error or undifined if not found, else TransformationConfig from database
    */
    public async getTransformationConfig(pipelineId: number, query: object): Promise<TransformationConfig | null | undefined> {
        console.debug(`Getting Transformation Configs with id ${pipelineId} and query parameters "${JSON.stringify(query)} from Database`)
        const condition: FindConditions<TransformationConfig> = Object.assign({ id: pipelineId, query })

        if (!this.checkClassInvariant()) {
          Promise.reject()
        }

        // return null if id not set
        if (!pipelineId) {
          return null;
        }

        // Get Configs from Database
        let transformationConfig: TransformationConfig | undefined
        try {
            transformationConfig = await this.configRepository.findOne(condition)
        } catch (error) {
            console.log(error)
            return null
        }

        // No entry found return undefined
        if (!transformationConfig) {
            return undefined
        }

        // Remove id Entries from metadata and transformation entry (autogenerated)
        delete transformationConfig.metadata.id
        delete transformationConfig.transformation.id

        console.debug(`Sucessfully got Transformation with id ${pipelineId} and conditions "${JSON.stringify(query)}" configs from Database`)
        return transformationConfig
    }


    /**
    * Gets all Transfromation Configs from the database
    * Filtered by conditions, provided by argument queryParams
    *
    * @param queryParams Object containing the query paramters (where conditions)
    * @returns Promise, containing a list of all transormation configs
    */
    public async getAllConfigs(queryParams: object): Promise<TransformationConfig[] | null> {
        console.debug(`Getting all Transformation Configs from Database`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }


        // Get Configs from Database
        let transformationConfigs: TransformationConfig[]
        try {
            if (queryParams && Object.keys(queryParams).length > 0) {
                transformationConfigs = await this.configRepository.find(queryParams)
            } else {
                transformationConfigs = await this.configRepository.find()
            }

        } catch (error) {
            console.log(error)
            return null
        }


        // Remove id Entries from metadata and transformation entry (autogenerated)
        for (let config of transformationConfigs) {
            delete config.metadata.id
            delete config.transformation.id
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
    public async saveTransformationConfig(transformationConfig: TransformationConfig): Promise<TransformationConfig>{
        console.debug(`Saving tranformation config.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        // create object from Body of the Request (=TransformationConfig)
        transformationConfig = this.configRepository.create(transformationConfig)
        // persist the Config
        const saveResult = this.configRepository.save(transformationConfig);

        console.debug("Pipeline Config persisted")
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

        const deletePromise = this.configRepository.delete(id)
        console.debug(`Successfully deleted config with id ${id}`)
        return deletePromise
    }


    /**
     * Updates a Transformation config for given id
     *
     * @param id id for the config to be updated
     * @param transformationConfig Transformation config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateTransformationConfig(id: number, transformationConfig: TransformationConfig): Promise<UpdateResult> {
        console.debug(`Updating config with id ${id}.`)
        if(!this.checkClassInvariant()){
            Promise.reject()
        }

        const updatePromise = this.configRepository.update(id, transformationConfig)
        console.debug(`Successfully updated config with id ${id}`)
        return updatePromise
    }


    /**
     * Updates config for given id with the Transformation config, provided by argument config
     * Currently only one config exists for given Pipeline ID.
     *
     * @param id pipeline id, the config is updated for
     * @param config config that gets written in the database
     * @returns Promise, containing the results of the update execution
     */
    public updateConfigForPipelineID(id: number, config: TransformationConfig): Promise<UpdateResult> {
        const condition = {"id": id}
        return this.configRepository.update(condition, config)
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
