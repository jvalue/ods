
import { DataRepository } from '../interfaces/dataRepository';
import ODSData from '../interfaces/odsData';
import { Pool, Client, PoolClient } from 'pg';



/**
 * This class handles Requests to the Nofification Database
 * in order to store and get Notification Configurations.
 */
export class StorageHandler implements DataRepository {


    private connectionPool!: Pool

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
        this.connectionPool = await this.initConnectionPool(retries, backoff)

        if (!this.connectionPool) {
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
    private async initConnectionPool(retries: number, backoff: number): Promise<Pool> {
        let conPool!: Pool
        let connectionErr: boolean = false
    
        // Pool Config
        const config = {
            host: process.env.DATABASE_HOST!,
            port: +process.env.DATABASE_PORT!,
            user: process.env.DATABASE_USER!,
            password: process.env.DATABASE_PW!,
            database: process.env.DATABASE_NAME!,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        }

        // try to establish connection
        for (let i = 1; i <= retries; i++) {
            console.info(`Initiliazing database connection (${i}/${retries})`)

            conPool = new Pool(config)

            if (!conPool) {
                console.error(`Connection pool could not be established.`)
                connectionErr = true
                await this.backOff(backoff);
                continue
            }

            // Check for backend and network parition errors
            conPool.on('error', async (err, client) => {
                console.error('Unexpected error on idle client', err)
                await this.backOff(backoff);
                connectionErr = true
            })

        }

        if (connectionErr || !conPool) {
            return Promise.reject("Connection to databse could not be established.")
        }

        console.info('Sucessfully established connection to storage-db database.')
        return Promise.resolve(conPool)
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
     * @param conditions      object, containing additional condtitions for the database query
     * @param tableName  tableName to get data for (is equal to pipeline id)
     * @returns Promise, containing a list of slack configs with given pipeline id
     */
    public async getData(tableName: string, conditions?: object): Promise<ODSData[]> {
        console.debug(`Getting transformed data from table ${tableName} from Database`)
        if (!this.checkClassInvariant()) {
            return Promise.reject()
        }

        let odsDataRows!: ODSData[]
        let client!: PoolClient
        
        try {
            client = await this.connectionPool.connect()  // Get a client from connection pool
            const whereClause = this.generateWhereClause(conditions)
            const resultSet = await client.query(`SELECT * FROM "${tableName}" ${whereClause}`)

            odsDataRows = resultSet.rows as ODSData[]

        } catch (error) {
            console.error(`Could not get Data from table ${tableName} with conditions ${conditions}: ${error}`)
            Promise.reject(error)
        } finally {
            if (client) {
                client.release()
            }
        }

        console.debug(`Sucessfully got data from Database`)
        return odsDataRows
    }




    /**
     * Persists dataset (provided by argument) to the config database
     *
     * @param data  ods data to persist
     * @returns Promise, containing the ods data 
     */
    public async saveData(tableName: string, data: ODSData): Promise<boolean> {
        console.debug(`Saving ods data.`)

        let persisted = true // indicator to show whether the data was persisted 
        let client!: PoolClient  // Client to execute the query

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        // remove id from data
        delete data.id

        try {
            // Get a client from connection pool
            client = await this.connectionPool.connect()  

            const insertStatement = this.generateInsertStatement(tableName, data)
            // persist the Config
            await client.query(insertStatement)

        } catch (err) {
            const errMsg = `Could save ODSData: ${err}`
            console.error(errMsg)
            persisted = false

            // Release the client
        } finally {

            if (client) {
                client.release()
            }
        }

        console.debug("Data sucessfully persisted.")
        return persisted
    }

    /**
     * Deletes dataset having specific conditions.
     *
     * @param tableName name of the table where the entry should be deleted
     * @param condition conditions to identify the entry/entries to delete
     * @returns result of the deletion execution
     */
    public async deleteData(tableName: string, conditions?: object): Promise<boolean> {
        console.debug(`Deleting data with condtion ${JSON.stringify(conditions)}.`)

        let deleted = true // indicator to show whether the data was delted 
        let client!: PoolClient  // Client to execute the query

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        try {
            // Get a client from connection pool
            client = await this.connectionPool.connect()

            const whereClause = this.generateWhereClause(conditions)
            // delete the Configs
            await client.query(`DELETE FROM TABLE ${tableName} ${whereClause} `)

        } catch (err) {
            const errMsg = `Could delete ODSData: ${err}`
            console.error(errMsg)
            deleted = false

        // Release the client
        } finally {

            if (client) {
                client.release()
            }
        }
        
        console.debug(`Successfully deleted dataset with condtion ${JSON.stringify(conditions)}`)
        return deleted
    }


    /**
     * Updates dataset, identified  by parameter conditions  
     * with data (provided by argument data)
     *
     * @param tableName     name of the table where to updated the data
     * @param data          data to be written to database
     * @param conditions    conditons to indentify the entries to be updated, e.g. {id: 1}
     * 
     * @returns Promise containing the updated data on success 
     *          or Promise containing undefined data, if data to be updated does not exist
     */
    public async updateData(tableName:string, data: ODSData, conditions?: object): Promise<boolean> {
        console.debug(`Updating dataset(s) in table ${tableName} with conditions ${JSON.stringify(conditions)}.`)
        let updated = true // indicator to show whether the data was persisted 
        
        let client!: PoolClient  // Client to execute the query

        if (!this.checkClassInvariant()) {
            Promise.reject()
        }

        const updateStatement = this.generateUpdateStatement(tableName, data, conditions)

        try {
            // Get a client from connection pool
            client = await this.connectionPool.connect()

            // Update the Config
            await client.query(updateStatement)

        } catch (err) {
            const errMsg = `Could save ODSData: ${err}`
            console.error(errMsg)
            updated = false

            // Release the client
        } finally {

            if (client) {
                client.release()
            }
        }

        console.debug(`Dataset(s) in table ${tableName} with conditions ${JSON.stringify(conditions)} sucessfully updated.`)
        return updated
    }

    /**
     * This funcion will create a pieline data table in the database (if not already exists)
     * by executing the database function createStructureForDataSource.
     * 
     * The result of this function is the creation of a table named after the pipeline id
     * 
     * @param tableName Pipeline Id for wich a table will be created in the database
     * @returns true on successfull table creation, else: false
     */
    public async createDataTable(tableName: string): Promise<boolean> {
        console.log(`Creating DataTable "${tableName}.`)
        if (!this.checkClassInvariant()) {
            return false
        
        }

        let client!: PoolClient // Client from Pool to execute the queries
        
        try {
            client = await this.connectionPool.connect()  // Get a client from connection pool
            await client.query(`SELECT storage.createStructureForDataSource(${tableName});`)
 
            // double check table existence
            await client.query(`SELECT * FROM ${tableName}`)
               

        } catch (err) {
            console.error(`Could not create ODSData table: ${err}`)
            return false

        // Release the client
        } finally {

            if (client) {
                client.release()
            }
        }

        console.log(`Successfully created DataTable "${tableName}.`)
        return true
    }


    /**
     * Drops a table with name, provided by parameter tableName
     * 
     * @param tableName name of the table to be dropped
     * @returns     true, if the table has been successfully droped, else: false.
     */
    public async dropTable(tableName: string): Promise<boolean>{
        console.log(`Dropping table "${tableName}`)

        if (!this.checkClassInvariant()) {
            return false

        }

        let client!: PoolClient // Client from Pool to execute the queries

        try {
            client = await this.connectionPool.connect()  // Get a client from connection pool
            await client.query(`SELECT storage.createStructureForDataSource(${tableName});`)

            // double check table existence
            await client.query(`SELECT * FROM ${tableName}`)


        } catch (err) {
            console.error(`Could not create ODSData table: ${err}`)
            return false

            // Release the client
        } finally {

            if (client) {
                client.release()
            }
        }

        console.log(`Successfully dropped DataTable "${tableName}.`)
        return true

    }


    /**
     * Generates a Insert-Statement for ODSData tables.
     * 
     * @param odsData odsData to generate VALUE-Clause for
     * @returns string, containing a value clause
     */
    private generateInsertStatement(tableName:string, odsData: ODSData): string {

        const valueClause = `("data", "license", "origin", "pipelineId", "timestamp") VALUES 
                (${odsData.data}, ${odsData.license}, ${odsData.origin}, ${odsData.pipelineId},${odsData.timestamp})`

        return `INSERT INTO TABLE ${tableName} ${valueClause} ` 
    }


    /**
     * Generates an UPDATE Statement for ODSData tables.
     * 
     * @param odsData odsData to generate the SET-Clause from
     * @returns SET Clause for an Update-SQL-Statement
     */
    private generateUpdateStatement(tableName: string, odsData: ODSData, conditions?: object): string {
        const setClause = `SET data = ${odsData.data}, license = ${odsData.license}, origin = ${odsData.origin},
                pipelineId = ${odsData.pipelineId}, timestamp = ${odsData.timestamp}`

        const whereClause = this.generateWhereClause(conditions)

        return `UPDATE TABLE ${tableName} ${setClause} ${whereClause}`
    }


    /**
     * Generates a where claus for a SQL-query 
     * 
     * @param conditions conditions to build the where query from.
     *                   Example: {id: 1}
     *                            will result in 'WHERE ID = 1'
     * 
     * @returns a string containing a WHERE-clause for a SQL-Query
     *          based on parameter conditions
     */
    private generateWhereClause(conditions?: object): string {
        let whereClause = ''
        if (!conditions || Object.keys(conditions).length == 0) {
            return whereClause
        }

        whereClause = 'WHERE'

        for (const [column, value] of Object.entries(conditions)) {
            let colValue = ''

            switch (typeof value) {

                case 'string':
                    colValue = `'${value}'`
                    break

                case 'undefined':
                    colValue = 'NULL'
                    break

                case 'number' || 'BigInt' || 'Boolean':
                    colValue = `${value}`
                    break

                default:
                    const errMsg = `Cannot generate WHERE Clause: data type ${typeof value} is not supported`
                    console.error(errMsg)
                    throw errMsg
            }

            whereClause + whereClause + ` "${column}" = ${value} AND`
        }

        // Delete last ' AND'
        whereClause = whereClause.substr(0, whereClause.length - 4)

        return whereClause

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

        if (!this.connectionPool) {
            msg.push('Config Database connection')
            result = false
        }

        if (!result) {
            console.error(`Error the following member variables are not set: ${msg}`)
        }

       return result
    }
}
