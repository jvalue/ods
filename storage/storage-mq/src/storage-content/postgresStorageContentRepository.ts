import { Pool, PoolConfig, PoolClient, QueryResult } from "pg"
import { StorageContentRepository } from "./storageContentRepository"
import { StorageContent } from "./storageContent"


export class PostgresStorageContentRepository implements StorageContentRepository {
    connectionPool?: Pool = undefined
    schema = process.env.DATABASE_SCHEMA

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
            connectionTimeoutMillis: 2000,
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

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async existsTable(tableIdentifier: string): Promise<boolean> {
      console.debug(`Checking if table "${tableIdentifier}" exists`)
      if (!this.connectionPool) {
          return Promise.reject("No connnection pool available")
      }

      let client!: PoolClient
      try {
          client = await this.connectionPool.connect()
          const resultSet = await client.query(`SELECT to_regclass('${this.schema}.${tableIdentifier}')`)
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

    async getAllContent(tableIdentifier: string): Promise<StorageContent[] | undefined> {
      console.debug(`Fetching all content from database, table "${tableIdentifier}"`)
      if (!this.connectionPool) {
          return Promise.reject("No connnection pool available")
      }

      const tableExists = await this.existsTable(tableIdentifier)
      if(!tableExists) {
        console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
        return Promise.resolve(undefined)
      }

      let client!: PoolClient
      try {
          client = await this.connectionPool.connect()
          const resultSet = await client.query(`SELECT * FROM "${this.schema}"."${tableIdentifier}"`)
          const content = resultSet.rows as StorageContent[]
          return Promise.resolve(content)
      } catch (error) {
          console.error(`Could not get content from table ${tableIdentifier}: ${error}`)
          return Promise.reject(error)
      } finally {
          if (client) {
              client.release()
          }
      }
    }

    async getContent(tableIdentifier: string, contentId: string): Promise<StorageContent | undefined> {
      console.debug(`Fetching content from database, table "${tableIdentifier}", id "${contentId}"`)
      if (!this.connectionPool) {
          return Promise.reject("No connnection pool available")
      }

      const tableExists = await this.existsTable(tableIdentifier)
      if(!tableExists) {
        console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
        return Promise.resolve(undefined)
      }

      let client!: PoolClient
      try {
          client = await this.connectionPool.connect()
          const resultSet = await client.query(`SELECT * FROM "${this.schema}"."${tableIdentifier}" WHERE id = $1`, [contentId])
          const content = resultSet.rows as StorageContent[]
          if(!content || !content[0]) {
            console.debug(`No content found for table "${tableIdentifier}", id ${contentId}`)
            return undefined
          }
          console.debug(`Fetched content for table "${tableIdentifier}", id ${contentId}: { pipelineId: ${content[0].pipelineId}, timestamp: ${content[0].timestamp}, data: <omitted in log>}`)
          return Promise.resolve(content[0])
      } catch (error) {
          console.error(`Could not get content from table ${tableIdentifier} with id ${contentId}: ${error}`)
          return Promise.reject(error)
      } finally {
          if (client) {
              client.release()
          }
      }
    }

    async saveContent(tableIdentifier: string, content: StorageContent): Promise<number> {
        console.debug(`Saving storage content data`)
        if (!this.connectionPool) {
            return Promise.reject("No connnection pool available")
        }

        delete content.id  // id not under control of client

        // Generate Query-String
        const data = JSON.stringify(content.data).replace("'", "''") // Escape single quotes
        const insertStatement = `INSERT INTO "${this.schema}"."${tableIdentifier}" ("data", "pipelineId", "timestamp") VALUES ($1, $2, $3) RETURNING *`
        const values = [data, parseInt(content.pipelineId), content.timestamp]

        let client!: PoolClient  // Client to execute the query
        try {
            client = await this.connectionPool.connect()
            const { rows } = await client.query(insertStatement, values)
            console.debug("Content sucessfully persisted.")
            return Promise.resolve(rows[0]["id"] as number)
        } catch (err) {
            const errMsg = `Could save content data: ${err}`
            console.error(errMsg)
            return Promise.reject(err)
        } finally {
            if (client) {
                client.release()
            }
        }
    }
}
