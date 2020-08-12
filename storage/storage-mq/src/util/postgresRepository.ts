import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg'

export default class PostgresRepository {
  private connectionPool?: Pool = undefined

  /**
   * Initializes the connection to the database.
   * @param retries:  Number of retries to connect to the database
   * @param backoffMs:  Time in ms to backoff before next connection retry
   * @returns reject promise on failure to connect
   */
  public async init (poolConfig: PoolConfig, retries: number, backoffMs: number): Promise<void> {
    this.connectionPool = await this.connectWithRetry(poolConfig, retries, backoffMs)
    console.info('Successfully established connection to database.')
  }

  private async connectWithRetry (poolConfig: PoolConfig, retries: number, backoffMs: number): Promise<Pool> {
    console.debug(`Connecting to database with config:\n${JSON.stringify(poolConfig)}`)

    let lastError: Error | undefined
    for (let i = 1; i <= retries; i++) {
      console.info(`Attempting to connect to database on URL ${poolConfig.host}:${poolConfig.port} (${i}/${retries})`)
      try {
        return await this.connect(poolConfig)
      } catch (err) {
        lastError = err
      }
      await this.sleep(backoffMs)
    }

    return Promise.reject(lastError)
  }

  private async connect (poolConfig: PoolConfig): Promise<Pool> {
    let client
    try {
      const connectionPool = new Pool(poolConfig)
      client = await connectionPool.connect()
      await client.query('SELECT 1')
      console.info('Successfully established database connection')
      return Promise.resolve(connectionPool)
    } finally {
      if (client) {
        client.release()
      }
    }
  }

  private sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private assertInitialized (): Promise<void> {
    if (!this.connectionPool) {
      return Promise.reject(new Error('No connection pool available'))
    } else {
      return Promise.resolve()
    }
  }

  public async executeQuery (query: string, args: unknown[]): Promise<QueryResult> {
    console.debug(`Executing query "${query}" with values ${JSON.stringify(args)}`)
    await this.assertInitialized()

    let client!: PoolClient
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      client = await this.connectionPool!.connect()
      const resultSet = await client.query(query, args)
      console.debug(`Query led to ${resultSet.rowCount} results`)
      return resultSet
    } catch (error) {
      console.error(`Failed to execute query: ${error}`)
      return Promise.reject(error)
    } finally {
      if (client) {
        client.release()
      }
    }
  }
}
