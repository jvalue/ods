import { PostgresRepository } from '@jvalue/node-dry-pg'
import { PoolConfig, QueryResult } from 'pg'

import { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PW, POSTGRES_DB, POSTGRES_SCHEMA } from '../env'

import { StorageContentRepository, StorageContent, InsertStorageContent } from './storageContentRepository'

const EXISTS_TABLE_STATEMENT = (schema: string, table: string): string => `SELECT to_regclass('"${schema}"."${table}"')`
const GET_ALL_CONTENT_STATEMENT = (schema: string, table: string): string => `SELECT * FROM "${schema}"."${table}"`
const GET_CONTENT_STATEMENT =
  (schema: string, table: string): string => `SELECT * FROM "${schema}"."${table}" WHERE id = $1`
const INSERT_CONTENT_STATEMENT = (schema: string, table: string): string =>
  `INSERT INTO "${schema}"."${table}" ("data", "pipelineId", "timestamp") VALUES ($1, $2, $3) RETURNING *`

/**
 * The QueryResultRow of a <code>SELECT to_regclass(...)</code> query
 */
interface ExistsTableResultRow {
  /**
   * PostgreSQL's Object Identifier as string of the requested table or null if the table does not exists
   */
  to_regclass: string | null
}

function extractTableExistenceFromResult (result: QueryResult<ExistsTableResultRow>): boolean {
  // to_regclass contains the table name as string or null if it does not exists
  return result.rows[0].to_regclass !== null
}

interface DatabaseStorageContent {
  id: string
  data: unknown
  timestamp: Date
  pipelineId: string
}

const POOL_CONFIG: PoolConfig = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PW,
  database: POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}

export class PostgresStorageContentRepository implements StorageContentRepository {
  private readonly postgresRepository = new PostgresRepository(POOL_CONFIG)

  async existsTable (tableIdentifier: string): Promise<boolean> {
    const resultSet: QueryResult<ExistsTableResultRow> =
      await this.postgresRepository.executeQuery(EXISTS_TABLE_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
    return extractTableExistenceFromResult(resultSet)
  }

  async getAllContent (tableIdentifier: string): Promise<StorageContent[] | undefined> {
    const tableExists = await this.existsTable(tableIdentifier)
    if (!tableExists) {
      console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
      return undefined
    }

    const resultSet =
      await this.postgresRepository.executeQuery(GET_ALL_CONTENT_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
    return this.toStorageContents(resultSet)
  }

  async getContent (tableIdentifier: string, contentId: string): Promise<StorageContent | undefined> {
    const tableExists = await this.existsTable(tableIdentifier)
    if (!tableExists) {
      console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
      return undefined
    }

    const resultSet = await this.postgresRepository.executeQuery(
      GET_CONTENT_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [contentId]
    )
    const content = this.toStorageContents(resultSet)
    if (content.length === 0) {
      console.debug(`No content found for table "${tableIdentifier}", id ${contentId}`)
      return undefined
    }
    console.debug(
      `Fetched content for table "${tableIdentifier}", id ${contentId}: ` +
      `{ pipelineId: ${content[0].pipelineId}, timestamp: ${content[0].timestamp.toISOString()}, ` +
      'data: <omitted in log> }'
    )
    return content[0]
  }

  async saveContent (tableIdentifier: string, content: InsertStorageContent): Promise<number> {
    // Generate Query-String
    const data = this.escapeQuotes(content.data)
    const values = [data, content.pipelineId, content.timestamp]

    const { rows } = await this.postgresRepository
      .executeQuery(INSERT_CONTENT_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), values)
    const id = +rows[0].id
    console.debug(`Content successfully persisted with id ${id}`)
    return id
  }

  private toStorageContents (resultSet: QueryResult<DatabaseStorageContent>): StorageContent[] {
    const contents: DatabaseStorageContent[] = resultSet.rows
    return contents.map(x => ({ ...x, id: parseInt(x.id), pipelineId: parseInt(x.pipelineId) }))
  }

  private escapeQuotes (data: unknown): string {
    return JSON.stringify(data).replace("'", "''")
  }
}
