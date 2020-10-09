import { Pool, PoolConfig, PoolClient, QueryResult } from 'pg'

import { sleep } from './sleep'

export default class PostgresRepository {
  private connectionPool?: Pool = undefined

  /**
   * Initializes the connection to the database.
   * @param poolConfig: configuration object for the connection pool
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
      try {
        return await this.connect(poolConfig)
      } catch (error) {
        lastError = error
        console.info(`Error connecting to database (${i}/${retries})`)
      }
      await sleep(backoffMs)
    }
    // can be simplified in one line when https://github.com/typescript-eslint/typescript-eslint/issues/2642 is fixed
    const error = lastError ?? new Error('Failed to connect to database')
    throw error
  }

  private async connect (poolConfig: PoolConfig): Promise<Pool> {
    let client: PoolClient | undefined
    try {
      const connectionPool = new Pool(poolConfig)
      client = await connectionPool.connect()
      await client.query('SELECT 1')
      console.info('Successfully established database connection')
      return connectionPool
    } finally {
      client?.release()
    }
  }

  public async executeQuery (query: string, args: unknown[]): Promise<QueryResult> {
    console.debug(`Executing query "${query}" with values ${JSON.stringify(args)}`)
    if (this.connectionPool === undefined) {
      throw new Error('No connection pool available')
    }

    let client: PoolClient | undefined
    try {
      client = await this.connectionPool.connect()
      const resultSet = await client.query(query, args)
      console.debug(`Query led to ${resultSet.rowCount} results`)
      return resultSet
    } catch (error) {
      console.error(`Failed to execute query: ${error}`)
      throw error
    } finally {
      client?.release()
    }
  }
}
