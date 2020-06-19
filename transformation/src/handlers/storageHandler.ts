import { Connection, ConnectionOptions, createConnection, getConnection, Repository, DeleteResult, UpdateResult } from 'typeorm';
import { TransformationConfig } from '../models/TransormationConfig';
import { TransformationRepository } from '../interfaces/transformationRepository';


/**
 * This class handles Requests to the Nofification Database 
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements TransformationRepository{

    private configRepository!: Repository<TransformationConfig>

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
        const handler: StorageHandler = this

        this.initConnection(retries, backoff).then(connection => {
            if (connection) {
                this.configRepository = connection.getRepository(TransformationConfig);    
            }

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
    private async initConnection(retries: number, backoff: number): Promise<Connection | null> {
        var dbCon: null | Connection = null
        var established: boolean = false
        /*=================================================================
        * Get connection Options from Environment variables
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
        console.log(`Getting Transformation Configs with pipelineId ${pipelineID} from Database`)

        var transformationConfigs: TransformationConfig[]

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

        console.log(`Sucessfully got ${transformationConfigs.length} Transformation configs from Database`)
        return transformationConfigs
    }

    /**
     * Persists a transformation config (provided by argument) to the config database
     *
     * @param transformationConfig    transformation config to persist
     * @returns Promise, containing the stored transformation config
     */
    public saveTransformationConfig(transformationConfig: TransformationConfig): boolean {

        // Init Repository for Transformation Config
        console.debug("Init Repository")

        // create object from Body of the Request (=TransformationConfig)
        console.debug("Init Transformation config")
        transformationConfig = this.configRepository.create(transformationConfig)

        // persist the Config
        console.debug("Save TransformationConfig to Repository")
        this.configRepository.save(transformationConfig);
        console.log("Webhook config persisted")

        return true
    }

    /**
     * Deletes a Transformation config for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteTransformationConfig(id: number): Promise<DeleteResult> {
        return this.configRepository.delete(id)
    }

    /**
     * Updates a Transformation config for given id
     *
     * @param id id for the config to be updated
     * @param transformationConfig Transformation config to be written to database
     * @returns Promise containing the result of the update operation
     */
    public updateTransoformationConfig(id: number, transformationConfig: TransformationConfig): Promise<UpdateResult> {
        return this.configRepository.update(id, transformationConfig)
    }

    /**
     * Deletes all configs in the database referring to given pipeline id.
     * Currently only one config exists for given Pipeline ID.
     * 
     * @param pipelineId Id of the pipeline to delete the configs for
     * @returns Promise, containing the results of the deletion execution
     */
    public deleteConfigsForPipelineID(pipelineId: number): Promise<DeleteResult> {
        console.log(`Deleting all configs for pipeline id "${pipelineId}"`)

        let condition = { "pipelineId": pipelineId }

        return this.configRepository.delete(condition)
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


}