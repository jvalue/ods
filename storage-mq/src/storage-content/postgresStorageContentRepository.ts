import { Pool, PoolConfig, PoolClient } from "pg"
import { StorageContentRepository } from "./storageContentRepository"

export class PostgresStorageContentRepository implements StorageContentRepository {
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

    getAllContent(tableIdentifier: string): Promise<import("./storageContent").StorageContent[]> {
      throw new Error("Method not implemented.")
    }
    getContent(tableIdentifier: string, contentId: string): Promise<import("./storageContent").StorageContent> {
      throw new Error("Method not implemented.")
    }
    saveContent(tableIdentifier: string, content: import("./storageContent").StorageContent): Promise<number> {
      throw new Error("Method not implemented.")
    }

}
