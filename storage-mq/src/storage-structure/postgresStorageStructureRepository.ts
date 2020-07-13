import { StorageStructureRepository } from "./storageStructureRepository"
import { Pool, PoolConfig, PoolClient } from "pg"

export class PostgresStorageStructureRepository implements StorageStructureRepository {

    connectionPool!: Pool

    /**
     * Initializes the connection to the database.
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     */
    public async init(retries: number, backoff: number): Promise<void> {
        console.debug('Initializing PostgresStorageStructureRepository')
        await this.initConnectionPool(retries, backoff)
        return this.checkClassInvariant()
    }

    /**
     * Initializes a database connection to the storage-db service.
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     *
     * @returns reject promise on failure to connect
     */
    private async initConnectionPool(retries: number, backoff: number): Promise<void> {
        let connectionErr: boolean = false

        const poolConfig : PoolConfig = {
            host: process.env.DATABASE_HOST!,
            port: +process.env.DATABASE_PORT!,
            user: process.env.DATABASE_USER!,
            password: process.env.DATABASE_PW!,
            database: process.env.DATABASE_NAME!,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        }

        // try to establish connection
        for (let i = 1; i <= retries; i++) {
            console.info(`Initiliazing database connection (${i}/${retries})`)

            this.connectionPool = new Pool(poolConfig)
            if (!this.connectionPool) {
                connectionErr = true
                await this.sleep(backoff);
                continue
            }
        }

        if (connectionErr || !this.connectionPool) {
            return Promise.reject("Connection to databse could not be established.")
        }

        console.info('Sucessfully established connection to storage-db database.')
        return Promise.resolve()
    }

    private sleep(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }


    /**
     * This funcion will create a table (if not already exists) for storing pipeline data.
     * Uses the database function 'createStructureForDataSource'.
     * @param tableIdentifier tableIdentifier for wich a table will be created with this name
     */
    async create(tableIdentifier: string): Promise<void> {
        console.log(`Creating table "${tableIdentifier}"`)
        await this.checkClassInvariant()

        let client!: PoolClient // Client from Pool to execute the queries
        try {
            client = await this.connectionPool.connect()  // Get a client from connection pool
            const queryResult = await client.query(`Set search_path to storage; SELECT storage.createStructureForDataSource('${tableIdentifier}');`)

        } catch (err) {
            console.error(`Could not create table: ${err}`)
            return  Promise.reject(err)
        } finally {
            if (client) {
                client.release()
            }
        }

        console.log(`Successfully created table "${tableIdentifier}.`)
        return Promise.resolve()
    }


    /**
     * Drops a table with name, provided by parameter tableIdentifier
     * @param tableIdentifier name of the table to be dropped
     */
    async delete(tableIdentifier: string): Promise<void> {
        console.log(`Dropping table "${tableIdentifier}`)
        await this.checkClassInvariant()

        let client!: PoolClient
        try {
            client = await this.connectionPool.connect()  // Get a client from connection pool
            await client.query(`Set search_path to storage;SELECT storage.deleteStructureForDataSource(${tableIdentifier});`)
        } catch (err) {
            console.error(`Could not create ODSData table: ${err}`)
            return Promise.reject(err)
        } finally {
            if (client) {
                client.release()
            }
        }

        console.log(`Successfully dropped table "${tableIdentifier}.`)
        return Promise.resolve()
    }

    /**
     * This function ensures that all objects are initialized
     * for further interaction with the config database
     *
     * @returns rejects promise if invariants not met.
     */
    private checkClassInvariant(): Promise<void> {
        if (!this.connectionPool) {
            return Promise.reject("No connnection pool available")
        }
        return Promise.resolve()
    }
}
