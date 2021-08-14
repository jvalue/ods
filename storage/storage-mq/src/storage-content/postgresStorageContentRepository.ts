import { PostgresClient } from '@jvalue/node-dry-pg'
import { ClientBase, QueryResult } from 'pg'

import { POSTGRES_SCHEMA } from '../env'

import { StorageContentRepository, StorageContent, InsertStorageContent } from './storageContentRepository'

import SchemaParser from './../service/schemaparser'

const EXISTS_TABLE_STATEMENT = (table: string): string => `SELECT to_regclass('"${POSTGRES_SCHEMA}"."${table}"')`
const GET_ALL_CONTENT_STATEMENT = (table: string): string => `SELECT * FROM "${POSTGRES_SCHEMA}"."${table}"`
const GET_CONTENT_STATEMENT = (table: string): string => `SELECT * FROM "${POSTGRES_SCHEMA}"."${table}" WHERE id = $1`
const GET_LAST_ELEMENT_STATEMENT = (table: string): string =>
  `SELECT "createdAt", "id" FROM "${POSTGRES_SCHEMA}"."${table}" ORDER BY "createdAt" DESC LIMIT 1`
const INSERT_CONTENT_STATEMENT = (table: string): string =>
  `INSERT INTO "${POSTGRES_SCHEMA}"."${table}" ("data", "pipelineId", "timestamp") VALUES ($1, $2, $3) RETURNING *`

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

async function existsTable (client: ClientBase, tableIdentifier: string): Promise<boolean> {
  const resultSet: QueryResult<ExistsTableResultRow> =
    await client.query(EXISTS_TABLE_STATEMENT(tableIdentifier))
  return extractTableExistenceFromResult(resultSet)
}

export class PostgresStorageContentRepository implements StorageContentRepository {
  constructor (private readonly postgresClient: PostgresClient) {}

  async getAllContent (tableIdentifier: string): Promise<StorageContent[] | undefined> {
    return await this.postgresClient.transaction(async client => {
      const tableExists = await existsTable(client, tableIdentifier)
      if (!tableExists) {
        console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
        return undefined
      }

      const resultSet = await client.query(GET_ALL_CONTENT_STATEMENT(tableIdentifier))
      return this.toStorageContents(resultSet)
    })
  }

  async getContent (tableIdentifier: string, contentId: string): Promise<StorageContent | undefined> {
    return await this.postgresClient.transaction(async client => {
      const tableExists = await existsTable(client, tableIdentifier)
      if (!tableExists) {
        console.debug(`Table "${tableIdentifier}" does not exist - returning no data`)
        return undefined
      }

      const resultSet = await client.query(GET_CONTENT_STATEMENT(tableIdentifier), [contentId])
      const content = this.toStorageContents(resultSet)
      if (content.length === 0) {
        console.debug(`No content found for table "${tableIdentifier}", id ${contentId}`)
        return undefined
      }
      return content[0]
    })
  }

  async saveContent (tableIdentifier: string, content: InsertStorageContent): Promise<number> {
    return await this.postgresClient.transaction(async client => {
      const tableExists = await existsTable(client, tableIdentifier)
      if (!tableExists) {
        throw new Error(`Table "${tableIdentifier}" does not exist - can not save content`)
      }

      /**
       * When passed an array as value, pg assumes the value is meant to be a native Postgres array
       * and therefore fails with a "invalid input syntax for type json" error when the target field
       * is actually of type jsob/jsonb.
       *
       * Ref: https://github.com/brianc/node-postgres/issues/2012
       */
      const data = Array.isArray(content.data) ? JSON.stringify(content.data) : content.data
      const values = [data, content.pipelineId, content.timestamp]
      const { rows } = await client.query(INSERT_CONTENT_STATEMENT(tableIdentifier), values)
      return parseInt(rows[0].id)
    })
  }

  async saveContentForSchema (tableIdentifier: string, content: InsertStorageContent): Promise<number> {
    return await this.postgresClient.transaction(async client => {
      const schemaParser = new SchemaParser()
      const resultSet = await client.query(GET_LAST_ELEMENT_STATEMENT(tableIdentifier))
      const nextId = (resultSet.rowCount === 0) ? 1 : parseInt(resultSet.rows[0].id) + 1

      /**
       * When passed an array as value, pg assumes the value is meant to be a native Postgres array
       * and therefore fails with a "invalid input syntax for type json" error when the target field
       * is actually of type jsob/jsonb.
       *
       * Ref: https://github.com/brianc/node-postgres/issues/2012
       */
      const insertStatement: string =
        await schemaParser.parse(content.schema as object, content.data, POSTGRES_SCHEMA, tableIdentifier, nextId)
      await client.query(insertStatement)
      return nextId
    })
  }

  private toStorageContents (resultSet: QueryResult<DatabaseStorageContent>): StorageContent[] {
    const contents: DatabaseStorageContent[] = resultSet.rows
    return contents.map(x => ({ ...x, id: parseInt(x.id), pipelineId: parseInt(x.pipelineId) }))
  }
}
