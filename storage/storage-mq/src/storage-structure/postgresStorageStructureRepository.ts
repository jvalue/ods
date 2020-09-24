import { StorageStructureRepository } from './storageStructureRepository'
import { PoolConfig } from 'pg'
import { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PW, POSTGRES_DB, POSTGRES_SCHEMA } from '../env'
import PostgresRepository from '@/util/postgresRepository'

const EXISTS_TABLE_STATEMENT = (schema: string, table: string): string => `SELECT to_regclass('${schema}.${table}')`
const CREATE_BUCKET_STATEMENT =
(schema: string, table: string): string => `CREATE TABLE IF NOT EXISTS "${schema}"."${table}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "data" jsonb NOT NULL,
  "timestamp" timestamp,
  "pipelineId" varchar,
  CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)
  )`
const DELETE_BUCKET_STATEMENT = (schema: string, table: string): string => `DROP TABLE "${schema}"."${table}" CASCADE`

export class PostgresStorageStructureRepository implements StorageStructureRepository {
  private postgresRepo: PostgresRepository

  constructor (postgresRepo: PostgresRepository) {
    this.postgresRepo = postgresRepo
  }

  /**
     * Initializes the connection to the database.
     * @param retries:  Number of retries to connect to the database
     * @param backoff:  Time in milliseconds to backoff before next connection retry
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

    await this.postgresRepo.init(poolConfig, retries, backoffMs)
  }

  async existsTable (tableIdentifier: string): Promise<boolean> {
    const resultSet =
      await this.postgresRepo.executeQuery(EXISTS_TABLE_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
    const tableExists = !!resultSet.rows[0].to_regclass
    console.debug(`Table ${tableIdentifier} exists: ${tableExists}`)
    return tableExists
  }

  /**
     * This funcion will create a table (if not already exists) for storing pipeline data.
     * Uses the database function 'createStructureForDataSource'.
     * @param tableIdentifier tableIdentifier for wich a table will be created with this name
     */
  async create (tableIdentifier: string): Promise<void> {
    await this.postgresRepo.executeQuery(CREATE_BUCKET_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
  }

  /**
     * Drops a table with name, provided by parameter tableIdentifier
     * @param tableIdentifier name of the table to be dropped
     */
  async delete (tableIdentifier: string): Promise<void> {
    await this.postgresRepo.executeQuery(DELETE_BUCKET_STATEMENT(POSTGRES_SCHEMA, tableIdentifier), [])
  }
}
