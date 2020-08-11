import { PoolConfig, QueryResult } from 'pg'
import { StorageContentRepository } from './storageContentRepository'
import PostgresRepository from '@/util/postgresRepository'
import { StorageContent } from './storageContent'
import { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PW, POSTGRES_DB, POSTGRES_SCHEMA } from '../env'

const EXISTS_TABLE_STATEMENT = (schema: string, table: string): string => `SELECT to_regclass('"${schema}"."${table}"')`
const GET_ALL_CONTENT_STATEMENT = (schema: string, table: string): string => `SELECT * FROM "${schema}"."${table}"`
const GET_CONTENT_STATEMENT =
  (schema: string, table: string): string => `SELECT * FROM "${schema}"."${table}" WHERE id = $1`
const INSERT_CONTENT_STATEMENT = (schema: string, table: string): string =>
  `INSERT INTO "${schema}"."${table}" ("data", "pipelineId", "timestamp") VALUES ($1, $2, $3) RETURNING *`

export class PostgresStorageContentRepository implements StorageContentRepository {
  postgresRepository: PostgresRepository

  constructor (postgresRepository: PostgresRepository) {
    this.postgresRepository = postgresRepository
  }

  /**
     * Initializes the connection to the database.
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in seconds to backoff before next connection retry
     */
  public async init (retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing PostgresStorageStructureRepository')

    const poolConfig: PoolConfig = {
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      user: POSTGRES_USER,
      password: POSTGRES_PW,
      database: POSTGRES_DB,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: backoffMs
    }

    await this.postgresRepository.init(poolConfig, retries, backoffMs)
  }

  async existsTable (tableIdentifier: string): Promise<boolean> {
    const resultSet =
      await this.postgresRepository.executeQuery(EXISTS_TABLE_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
    const tableExists = !!resultSet.rows[0].to_regclass
    return Promise.resolve(tableExists)
  }

  async getAllContent (tableIdentifier: string): Promise<StorageContent[] | undefined> {
    const tableExists = await this.existsTable(tableIdentifier)
    if (!tableExists) {
      console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
      return Promise.resolve(undefined)
    }

    const resultSet =
      await this.postgresRepository.executeQuery(GET_ALL_CONTENT_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
    const content = this.toContents(resultSet)
    return Promise.resolve(content)
  }

  async getContent (tableIdentifier: string, contentId: string): Promise<StorageContent | undefined> {
    const tableExists = await this.existsTable(tableIdentifier)
    if (!tableExists) {
      console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
      return Promise.resolve(undefined)
    }

    const resultSet = await this.postgresRepository.executeQuery(
      GET_CONTENT_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [contentId]
    )
    const content = this.toContents(resultSet)
    if (!content || !content[0]) {
      console.debug(`No content found for table "${tableIdentifier}", id ${contentId}`)
      return undefined
    }
    console.debug(
      `Fetched content for table "${tableIdentifier}", id ${contentId}: ` +
      `{ pipelineId: ${content[0].pipelineId}, timestamp: ${content[0].timestamp}, data: <omitted in log>}`
    )
    return Promise.resolve(content[0])
  }

  async saveContent (tableIdentifier: string, content: StorageContent): Promise<number> {
    delete content.id // id not under control of client

    // Generate Query-String
    const data = this.escapeQuotes(content.data)
    const values = [data, parseInt(content.pipelineId), content.timestamp]

    const { rows } = await this.postgresRepository
      .executeQuery(INSERT_CONTENT_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), values)
    console.debug('Content successfully persisted.')
    return Promise.resolve(rows[0].id as number)
  }

  private toContents (resultSet: QueryResult<object>): StorageContent[] {
    const contents = resultSet.rows as StorageContent[]
    contents.forEach((x) => {
      x.id = x.id ? +x.id : undefined // convert to number
    })
    return contents
  }

  private escapeQuotes (data: object): string {
    return JSON.stringify(data).replace("'", "''")
  }
}
