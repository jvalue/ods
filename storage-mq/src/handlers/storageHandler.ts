
import { Connection, ConnectionOptions, createConnection, getConnection, Repository, DeleteResult, EntitySchema } from 'typeorm';
import { DataRepository } from '../interfaces/dataRepository';
import ODSData from '../models/odsData';
import { createTableEntity } from '../models/odsData';


/**
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements DataRepository {
    private dbConnection!: Connection | null
    private repositoryMap!: Map<string, Repository<ODSData>>
    private connectionMap: Map<string, Connection> = new Map()

    /**
     * Generates connction options for typeorm postgres database connection.
     * 
     * @param tableName unique Name of the database connection for reeusability
     * @param entityTypes typeORM Entity Class to pass to the connectionOptions
     *                    (a table will be created for this Class)
     */
    private generateConnectionOptions(tableName: string, entityTypes?:any[]) {
        console.debug(`Generating connection options for connection with name "${tableName}"`)
        let entities = []

        const name = `table:${tableName}`;

        if (entityTypes) {
            entities = entityTypes
        }

        let connectionOptions: ConnectionOptions = {
            type: "postgres",
            host: process.env.DATABASE_HOST!,
            port: +process.env.DATABASE_PORT!,
            username: process.env.DATABASE_USER!,
            password: process.env.DATABASE_PW!,
            database: process.env.DATABASE_NAME!,
            synchronize: true,
            // logging: true,
            entities: entities,
            name: name
        }
        console.debug(`Succesfully generated connection options for connection with name "${connectionOptions.name}"`)
        return connectionOptions
    }

    /**
     * Gets the reposity for the table with table name provided by argument tableName
     * A database connection for given Table (provided by table name) will be established.
     * 
     * This ensures that the tableschema has been created before handling operations.
     * One repository/connection is held per database table in Map repositoryMap 
     * and existing repositories will be reused.
     * 
     * The default connection pool by pg/typeorm will handle connections, so many connections
     * will have no effect on performance.
     * 
     * @param tableName tableName to establish the connection for 
     * @returns         connection for given database table
     */
    private async getRepository(tableName: string): Promise< Repository<ODSData> >{
        console.debug(`Getting repository for table "${tableName}"`)
        const entityType = createTableEntity(tableName)
        const key = (entityType as any).tableName;
        
        if (!this.repositoryMap.has(key)) {
            console.debug(`Generating new repository for table "${tableName}"`)
            // Set connection options
            let connectionOptions = this.generateConnectionOptions(tableName, [entityType])
            
            // Create Connection
            const connection = await this.initConnection(connectionOptions, 10, 3)
                .catch(error => {
                    console.error(`Connection could not be established.`)
                    return Promise.reject()
                })
            
            if (!connection) {
                console.error(`Repository could not be created: Connection could not established`)
                return Promise.reject()
            }
            
            // Create Repository
            const repository = connection.getRepository(entityType)

            if (!repository) {
                console.error()
                return Promise.reject()
            }

            this.repositoryMap.set(key, repository);
        }

        console.debug(`Successfully got repository for table "${tableName}"`)
        return this.repositoryMap.get(key) as Repository<ODSData>;
    }

    /**
     * Initializes the components of the storage handler.
     * This is done by testing a connection to the storage database 
     * 
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     */
    public async init(retries: number, backoff: number): Promise<void> {
        console.debug('Initializing storageHandler.')

        // Test the connection
        let conOptions = this.generateConnectionOptions('test')
        this.dbConnection = await this.initConnection(conOptions,retries, backoff)

        this.repositoryMap = new Map()
        if (!this.dbConnection) {
            console.error('Could not initialize storageHandler.')
            return Promise.reject()
        }
    
        // this.dbConnection.close()

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }
        return Promise.resolve()
    }

    /**
     * Initializes a database connection to the storage-db service.
     *
     * @param connectionOptions Connection options for the database connection (see typeOrm)
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     *
     * @returns     a Promise, containing either a Connection on success or null on failure
     */
    private async initConnection(connectionOptions: ConnectionOptions, retries: number, backoff: number): Promise<Connection | null> {
        let dbCon: null | Connection = null
        let connected: boolean = false
    

        // try to establish connection
        for (let i = 1; i <= retries; i++) {
            console.info(`Initiliazing database connection (${i}/${retries})`)

            dbCon = await createConnection(connectionOptions).catch(() => { return null })

            if (!dbCon) {
                await this.backOff(backoff);
            } else {
                connected = true
                break;
            }
        }

        if (!connected || !dbCon) {
            return Promise.reject("Connection to databse could not be established.")
        }

        dbCon.close()
        console.info('Sucessfully established connection to storage-db database.')
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

        try {
            const repository = await this.getRepository(`${id}`)
            data = await repository.findOne(id)
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

        const tableName = `${data.pipelineId}`
        // create object from Body of the Request (=PipelineConfig)
        const repository = await this.getRepository(`${data.pipelineId}`)

        if (!repository) {
            console.error(`Cannot save data: Repository is not set.`)
        }

        data = repository.create()
        // persist the Config
        const saveResult = await repository.save(data);

        console.debug("Data sucessfully persisted.")
        return saveResult
    }

    /**
     * Deletes dataset  for given id
     *
     * @param id id for the config to be deleted
     * @returns result of the deletion execution
     */
    public async deleteData(id: number): Promise<DeleteResult> {
        console.debug(`Deleting data with id ${id}.`)

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }
        const repository = await this.getRepository(`${id}`)
    
        const deletePromise = await repository.delete(id)
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
        data.pipelineId = `${id}` // Set id of the pipelineConfig

        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        const repository = await this.getRepository(`${id}`)

        // Check if config to update exsits (--> else: reject Promise)
        try {
            const configToUpdate = await repository.findOne(id)

            if (!configToUpdate) {
                return updatedData
            }

        } catch (error) {
            console.error(`Error finding config to be updated: ${error}`)
            return Promise.reject('Internal Server Error.')
        }


        // Update Config (only possible to save in order to update all relations)
        try {
           
            updatedData = repository.save(data)
        } catch (error) {
            console.error(`Error saving config: ${error}`)
            return Promise.reject('Internal Server Error: Could not update config.')
        }

        console.debug(`Successfully updated config with id ${id}`)
        return updatedData
    }

    /**
     * This funcion will create a pieline data table in the database
     * by executing the database function createStructureForDataSource.
     * 
     * The result of this function is the creation of a table named after the pipeline id
     * 
     * @param tableName Pipeline Id for wich a table will be created in the database
     * @returns true on successfull table creation, else: false
     */
    private async createPipelineDataTable(tableName: string): Promise<boolean> {
        if (!this.checkClassInvariant()) {
            return false
        }

        await getConnection().createEntityManager().
            query(`SELECT storage.createStructureForDataSource(${tableName});`).
            catch((err: Error) => {
                console.error(`Could not create pipeline table: ${err}`)
                return false
            })
        
        return true
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

        if (!result) {
            console.error(`Error the following member variables are not set: ${msg}`)
        }

       return result
    }
}
