import { Connection, ConnectionOptions, createConnection, getConnection, Repository, DeleteResult, UpdateResult, FindConditions, InsertResult } from 'typeorm';
import { PipelineConfig } from '../models/PipelineConfig';
import { PipelineRepository } from '../interfaces/pipelineRepository';
import { PipelineMetaData } from '../models/PipelineMetaData';
import TransformationConfig from '../models/TransformationConfig';
import { config } from 'process';



/**
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements PipelineRepository{

    private configRepository!: Repository<PipelineConfig>
    private metadataRepository!: Repository<PipelineMetaData>
    private pipelineRepository!: Repository<TransformationConfig>

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
        this.configRepository = this.dbConnection.getRepository(PipelineConfig);
        this.metadataRepository = this.dbConnection.getRepository(PipelineMetaData)
        this.pipelineRepository = this.dbConnection.getRepository(TransformationConfig)

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
            //logging: true,
            entities: [
                PipelineConfig,
                PipelineMetaData,
                TransformationConfig
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
    * @returns          null on error or undifined if not found, else PipelineConfig from database
    */
    public async getPipelineConfig(pipelineId: number, query: object): Promise<PipelineConfig | null | undefined> {
        console.debug(`Getting Pipeline Configs with id ${pipelineId} and query parameters "${JSON.stringify(query)} from Database`)

        // Assign Conditions for the database query
        let condition: FindConditions<PipelineConfig> = Object.assign(query)
        condition.id = pipelineId

        if (!this.checkClassInvariant()) {
          Promise.reject()
        }

        // return null if id not set
        if (!pipelineId) {
          return null;
        }

        // Get Configs from Database
        let pipelineConfig: PipelineConfig | undefined
        try {
            pipelineConfig = await this.configRepository.findOne(condition)
        } catch (error) {
            console.log(error)
            return null
        }

        // No entry found return undefined
        if (!pipelineConfig) {
            return undefined
        }

        // Remove id Entries from metadata and pipeline entry (autogenerated)
        delete pipelineConfig.metadata.id
        delete pipelineConfig.transformation.id

        console.debug(`Sucessfully got Pipeline with id ${pipelineId} and conditions "${JSON.stringify(query)}" configs from Database`)
        return pipelineConfig
    }


    /**
    * Gets all Transfromation Configs from the database
    * Filtered by conditions, provided by argument queryParams
    *
    * @param queryParams Object containing the query paramters (where conditions)
    * @returns Promise, containing a list of all transormation configs
    */
    public async getAllConfigs(queryParams: object): Promise<PipelineConfig[] | null> {
        console.debug(`Getting all Pipeline Configs from Database with query parameters ${JSON.stringify(queryParams)}`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        // Get Configs from Database
        let pipelineConfigs: PipelineConfig[]
        try {
            if (queryParams && Object.keys(queryParams).length > 0) {
                pipelineConfigs = await this.configRepository.find(queryParams)
            } else {
                pipelineConfigs = await this.configRepository.find()
            }

        } catch (error) {
            console.log(error)
            return null
        }

        // Remove id Entries from metadata and pipeline entry (autogenerated)
        for (let config of pipelineConfigs) {
            delete config.metadata.id
            delete config.transformation.id
        }

        console.debug(`Sucessfully got ${pipelineConfigs.length} Pipeline configs from Database`)
        return pipelineConfigs
    }

    /**
     * Persists a pipeline config (provided by argument) to the config database
     *
     * @param pipelineConfig    pipeline config to persist
     * @returns Promise, containing the stored pipeline config
     */
    public async savePipelineConfig(pipelineConfig: PipelineConfig): Promise<PipelineConfig>{
        console.debug(`Saving tranformation config.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        // create object from Body of the Request (=PipelineConfig)
        pipelineConfig = this.configRepository.create(pipelineConfig)
        // persist the Config
        const saveResult = this.configRepository.save(pipelineConfig);

        console.debug("Pipeline Config persisted")
        return saveResult
    }

    /**
     * Deletes a Pipeline config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deletePipelineConfig(id: number): Promise<DeleteResult> {
        console.debug(`Deleting conifg with id ${id}.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        const deletePromise = this.configRepository.delete(id)
        console.debug(`Successfully deleted config with id ${id}`)
        return deletePromise
    }

 
    /**
     * Updates a Pipeline config for given id
     *
     * @param id id for the config to be updated
     * @param pipelineConfig Pipeline config to be written to database
     * @returns Promise containing the updated config on success 
     *          or Promise containing undefined Config, if config to be updated sdoes not exist
     */
    public async updatePipelineConfig(id: number, pipelineConfig: PipelineConfig): Promise<PipelineConfig> {
        console.debug(`Updating config with id ${id}.`)
        let updatedConfig!: Promise<PipelineConfig>
        pipelineConfig.id = id // Set id of the pipelineConfig

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
    
        // Check if config to update exsits (--> else: reject Promise)
        try {
            const configToUpdate = await this.configRepository.findOne(id)

            if (!configToUpdate) {
                return updatedConfig
            }
            
        } catch (error) {
            console.error(`Error finding config to be updated: ${error}`)
            return Promise.reject('Internal Server Error.')
        }
        

        // Update Config (only possible to save in order to update all relations)
        try {
            updatedConfig = this.configRepository.save(pipelineConfig)           
        } catch (error) {        
            console.error(`Error saving config: ${error}`)
            return Promise.reject('Internal Server Error: Could not update config.')
        }
        
        console.debug(`Successfully updated config with id ${id}`)
        return updatedConfig
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
            msg.push('Pipeline config repository')
            result = false
        }

        if (!this.metadataRepository) {
            msg.push('PipelineMetaData config repository')
            result = false
        }

        if (!this.pipelineRepository) {
            msg.push('TransformationConfig config repository')
            result = false
        }

        if (!result) {
           console.error(`Error the following member variables are not set: ${msg}`)
        }

        return result
    }

}
