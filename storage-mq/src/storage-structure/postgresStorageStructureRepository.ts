import { StorageStructureRepository } from "./storageStructureRepository"
import { Pool, PoolConfig, PoolClient } from "pg"

export class PostgresStorageStructureRepository implements StorageStructureRepository {

    connectionPool?: Pool

    /**
     * Initializes the connection to the database.
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     */
    public async init(retries: number, backoff: number): Promise<void> {
        console.debug('Initializing PostgresStorageStructureRepository')
        await this.initConnectionPool(retries, backoff)
    }

    /**
     * Initializes a database connection to the storage-db service.
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     *
     * @returns reject promise on failure to connect
     */
    private async initConnectionPool(retries: number, backoff: number): Promise<void> {

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
      console.debug(`Connecting to database with config:\n${JSON.stringify(poolConfig)}`)

      // try to establish connection
      for (let i = 1; i <= retries; i++) {
          console.info(`Initiliazing database connection (${i}/${retries})`)
          let client
          try {
            const connectionPool = new Pool(poolConfig)
            client = await connectionPool.connect()
            this.connectionPool = connectionPool
            console.info(`Successfully established database connection`)
            break
          } catch (error) {
            await this.sleep(backoff);
            continue
          } finally {
            if (client) {
              client.release()
            }
          }
      }

      if (!this.connectionPool) {
          return Promise.reject("Connection to databse could not be established.")
      }

      console.info('Sucessfully established connection to storage-db database.')
      return Promise.resolve()
    }

    private sleep(backOff: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, backOff * 1000));
    }

    async existsTable(tableIdentifier: string): Promise<boolean> {
      console.debug(`Checking if table "${tableIdentifier}" exists`)
      if (!this.connectionPool) {
          return Promise.reject("No connnection pool available")
      }

      let client!: PoolClient
      try {
          client = await this.connectionPool.connect()
          const resultSet = await client.query(`SELECT to_regclass('${tableIdentifier}')`)
          const tableExists = !!resultSet.rows[0].to_regclass
          console.debug(`Table ${tableIdentifier} exists: ${tableExists}`)
          return Promise.resolve(tableExists)
        } catch (error) {
            console.error(`Error when checking if table ${tableIdentifier} exists:\n${error}`)
            return Promise.reject(error)
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    /**
     * This funcion will create a table (if not already exists) for storing pipeline data.
     * Uses the database function 'createStructureForDataSource'.
     * @param tableIdentifier tableIdentifier for wich a table will be created with this name
     */
    async create(tableIdentifier: string): Promise<void> {
        console.debug(`Creating table "${tableIdentifier}"`)
        if (!this.connectionPool) {
            return Promise.reject("No connnection pool available")
        }

        let client!: PoolClient
        try {
            client = await this.connectionPool.connect()
            await client.query(`CREATE TABLE IF NOT EXISTS "${tableIdentifier}" (
                "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
                "data" jsonb NOT NULL,
                "timestamp" timestamp,
                "origin" varchar,
                "license" varchar,
                "pipelineId" varchar,
                CONSTRAINT "Data_pk_${tableIdentifier}" PRIMARY KEY (id)
              )`)
        } catch (err) {
            console.error(`Could not create table: ${err}`)
            return  Promise.reject(err)
        } finally {
            if (client) {
                client.release()
            }
        }

        console.debug(`Successfully created table "${tableIdentifier}"`)
        return Promise.resolve()
    }


    /**
     * Drops a table with name, provided by parameter tableIdentifier
     * @param tableIdentifier name of the table to be dropped
     */
    async delete(tableIdentifier: string): Promise<void> {
        console.log(`Dropping table "${tableIdentifier}`)
        if (!this.connectionPool) {
            return Promise.reject("No connnection pool available")
        }

        let client!: PoolClient
        try {
            client = await this.connectionPool.connect()
            await client.query(`DROP TABLE "${tableIdentifier}" CASCADE`)
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
}
