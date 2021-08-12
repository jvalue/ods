import { PostgresClient } from '@jvalue/node-dry-pg'

import { POSTGRES_SCHEMA } from '../env'

import { StorageStructureRepository } from './storageStructureRepository'

const CREATE_BUCKET_STATEMENT =
(schema: string, table: string): string => `CREATE TABLE IF NOT EXISTS "${schema}"."pegel" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "uuid" text,
  "number" text,
  CONSTRAINT "Data_pk_${schema}_pegel" PRIMARY KEY (id)
  )`
const CREATE_BUCKET_WATER_STATEMENT =
(schema: string, table: string): string => `CREATE TABLE IF NOT EXISTS "${schema}"."water" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "pegelid" bigint NOT NULL,
  "shortname" text,
  "longname" text,
  CONSTRAINT "Data_pk_${schema}_water" PRIMARY KEY (id),
  CONSTRAINT "Data_fk_${schema}_water" FOREIGN KEY (pegelid) REFERENCES ${schema}.pegel(id)
  )`
const CREATE_BUCKET_B_STATEMENT =
(schema: string, table: string): string => `CREATE TABLE IF NOT EXISTS "${schema}"."${table}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "data" jsonb NOT NULL,
  "timestamp" timestamp,
  "pipelineId" bigint,
  CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)
  )`
const DELETE_BUCKET_STATEMENT = (schema: string, table: string): string => `DROP TABLE "${schema}"."${table}" CASCADE`

export class PostgresStorageStructureSchemaRepository implements StorageStructureRepository {
  constructor (private readonly postgresClient: PostgresClient) {}

  /**
     * This function will create a table (if not already exists) for storing pipeline data.
     * Uses the database function 'createStructureForDataSource'.
     * @param tableIdentifier tableIdentifier for wich a table will be created with this name
     */
  async create (tableIdentifier: string): Promise<void> {
    await this.postgresClient.executeQuery(CREATE_BUCKET_STATEMENT(POSTGRES_SCHEMA, tableIdentifier))
    await this.postgresClient.executeQuery(CREATE_BUCKET_B_STATEMENT(POSTGRES_SCHEMA, tableIdentifier))
    await this.postgresClient.executeQuery(CREATE_BUCKET_WATER_STATEMENT(POSTGRES_SCHEMA, tableIdentifier))
  }

  async createForSchema (schema: any, schemaName: string, tableName: string): Promise<void> {
  }

  /**
     * Drops a table with name, provided by parameter tableIdentifier
     * @param tableIdentifier name of the table to be dropped
     */
  async delete (tableIdentifier: string): Promise<void> {
    await this.postgresClient.executeQuery(DELETE_BUCKET_STATEMENT(POSTGRES_SCHEMA, tableIdentifier))
  }
}
