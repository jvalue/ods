import { Pool, PoolConfig, PoolClient, QueryResult } from "pg"
import { StorageContentRepository } from "./storageContentRepository"
import { StorageContent } from "./storageContent"

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

    async getContent(tableIdentifier: string, contentId: string): Promise<StorageContent> {
      console.debug(`Fetching data from database, table "${tableIdentifier}", id "${contentId}"`)
      await this.checkClassInvariant()

      let client!: PoolClient
      try {
          client = await this.connectionPool.connect()
          const resultSet = await client.query(`SELECT * FROM "${tableIdentifier}" WHERE id = ${contentId}`)
          const content = resultSet.rows as StorageContent[]
          if(!content || !content[0]) {
            return Promise.reject(`Content with ${contentId} not found`)
          }
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
        await this.checkClassInvariant()

        delete content.id  // id not under control of client

        // Generate Query-String
        const data = JSON.stringify(content.data).replace("'", "''") // Escape single quotes
        const insertStatement = `SET search_path to storage; INSERT INTO "${tableIdentifier}" ("data", "license", "origin", "pipelineId", "timestamp") VALUES ('$1', '$2', '$3', $4, '$5') RETURNING *`
        const values = [data, content.license, content.origin, parseInt(content.pipelineId), content.timestamp]

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

    /**
     * Generates a Insert-Statement for content data tables.\
     * @param odsData odsData to generate VALUE-Clause for
     * @returns string, containing a value clause
     */
    private generateInsertStatement(tableIdentifier: string, content: StorageContent): string {
      const data = JSON.stringify(content.data).replace("'", "''") // Escape single quotes
      const valueClause = `("data", "license", "origin", "pipelineId", "timestamp") VALUES
              ('${data}', '${content.license}', '${content.origin}', ${content.pipelineId}, '${content.timestamp}')`
      return `INSERT INTO "${tableIdentifier}" ${valueClause} `
  }
}
