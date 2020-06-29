
import { Connection, ConnectionOptions, createConnection, getConnection, Repository, UpdateResult, DeleteResult } from 'typeorm';
import { DataRepository } from '../interfaces/dataRepository';
import ODSData from '../models/odsData';

/**
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements DataRepository {

    private dataRepository!: Repository<ODSData>

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
          ODSData
      ]
    }


    /**
     * Initializes the components of the storage handler.
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

        this.dataRepository = this.dbConnection.getRepository(ODSData);
       

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
     * Get data for specific id from the database
     *
     * @param id    ID to get the Data for
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
    public async getData(id: number): Promise<ODSData |undefined> {
        console.debug(`Getting Slack Configs with pipelineId ${id} from Database`)
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        let data: ODSData| undefined

        if (!this.dataRepository) {
            console.error('Could not get slack configs  for pipeline id "${pipelineId}": Slack repository not initialized.')
            return Promise.reject()
        }

        try {
            data = await this.dataRepository.findOne(id)
        } catch (error) {
            Promise.reject(error)
        }

        console.debug(`Sucessfully got data from Database`)
        return data
    }

    /**
     * Persists dataset (provided by argument) to the config database
     *
     * @param data  ods data to persist
     * @returns Promise, containing the ods data 
     */
    public async saveData(data: ODSData): Promise<ODSData> {
        console.debug(`Saving ods data.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        // create object from Body of the Request (=PipelineConfig)
        data = this.dataRepository.create(data)
        // persist the Config
        const saveResult = this.dataRepository.save(data);

        console.debug("Data sucessfully persisted.")
        return saveResult
    }

    /**
     * Deletes dataset  for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public deleteData(id: number): Promise<DeleteResult> {
        console.debug(`Deleting data with id ${id}.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        const deletePromise = this.dataRepository.delete(id)
        console.debug(`Successfully deleted config with id ${id}`)
        return deletePromise
    }


    /**
     * Updates dataset for given id
     *
     * @param id id of the data to be updated
     * @param pipelineConfig data to be written to database
     * @returns Promise containing the updated data on success 
     *          or Promise containing undefined data, if data to be updated does not exist
     */
    public async updateData(id: number, data: ODSData): Promise<ODSData> {
        console.debug(`Updating config with id ${id}.`)
        let updatedData!: Promise<ODSData>
        data.id = id // Set id of the pipelineConfig

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        // Check if config to update exsits (--> else: reject Promise)
        try {
            const configToUpdate = await this.dataRepository.findOne(id)

            if (!configToUpdate) {
                return updatedData
            }

        } catch (error) {
            console.error(`Error finding config to be updated: ${error}`)
            return Promise.reject('Internal Server Error.')
        }


        // Update Config (only possible to save in order to update all relations)
        try {
            updatedData = this.dataRepository.save(data)
        } catch (error) {
            console.error(`Error saving config: ${error}`)
            return Promise.reject('Internal Server Error: Could not update config.')
        }

        console.debug(`Successfully updated config with id ${id}`)
        return updatedData
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

        if (!this.dataRepository) {
            msg.push('Data repository')
            result = false
        }

        if (!result) {
            console.error(`Error the following member variables are not set: ${msg}`)
        }

       return result
    }
}
