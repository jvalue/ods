import { Connection, ConnectionOptions, createConnection, getConnection } from 'typeorm';
import { TransformationConfig } from '../interfaces/TransormationConfig';


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
    public static async initConnection(retries: number, backoff: number): Promise<Connection | null> {
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
                TransformationConfig
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
    private static backOff(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    /**===========================================================================================
    * Gets all Transfromation Configs from the database for a specific pipeline id
    * 
    * @param pipelineID    Pipeline ID to get the Transfromation Configs for
    *============================================================================================*/
    public static async getTransformationConfigs(pipelineID: number): Promise<TransformationConfig[] | null> {
        console.log(`Getting Transformation Configs with pipelineId ${pipelineID} from Database`)

        var transformationConfigs: TransformationConfig[]

        // return null if id not set
        if (!pipelineID) {
            return null;
        }

        // Get Configs from Database 
        try {
            const repository = getConnection().getRepository(TransformationConfig)
            transformationConfigs = await repository.find({ pipelineId: pipelineID })
        } catch (error) {
            console.log(error)
            return null
        }
        console.log(`Sucessfully got ${transformationConfigs.length} Transformation configs from Database`)
        return transformationConfigs
 
    }


    /**===============================================================
     * TODO: Document
     * 
     *===============================================================*/
    public static saveTransformationConfig(transformationConfig: TransformationConfig): boolean {

        // Init Repository for Transformation Config
        console.debug("Init Repository")
        const postRepository = getConnection().getRepository(TransformationConfig)

        // create object from Body of the Request (=TransformationConfig)
        console.debug("Init Transformation config")
        transformationConfig = postRepository.create(transformationConfig)

        // persist the Config
        console.debug("Save TransformationConfig to Repository")
        postRepository.save(transformationConfig);
        console.log("Webhook config persisted")

        return true
    }

}