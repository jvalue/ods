import { PostgresClient } from '@jvalue/node-dry-pg';

import { POSTGRES_SCHEMA } from '../env';

import { StorageStructureRepository } from './storageStructureRepository';

const CREATE_BUCKET_STATEMENT = (
  schema: string,
  table: string,
): string => `CREATE TABLE IF NOT EXISTS "${schema}"."${table}" (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "data" jsonb NOT NULL,
  "timestamp" timestamp,
  "pipelineId" bigint,
  CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)
  )`;
const DELETE_BUCKET_STATEMENT = (schema: string, table: string): string =>
  `DROP TABLE "${schema}"."${table}" CASCADE`;

export class PostgresStorageStructureRepository
  implements StorageStructureRepository
{
  constructor(private readonly postgresClient: PostgresClient) {}

  /**
   * This function will create a table (if not already exists) for storing pipeline data.
   * Uses the database function 'createStructureForDataSource'.
   * @param tableIdentifier tableIdentifier for wich a table will be created with this name
   */
  async create(tableIdentifier: string): Promise<void> {
    await this.postgresClient.executeQuery(
      CREATE_BUCKET_STATEMENT(POSTGRES_SCHEMA, tableIdentifier),
    );
  }

  /**
   * Drops a table with name, provided by parameter tableIdentifier
   * @param tableIdentifier name of the table to be dropped
   */
  async delete(tableIdentifier: string): Promise<void> {
    await this.postgresClient.executeQuery(
      DELETE_BUCKET_STATEMENT(POSTGRES_SCHEMA, tableIdentifier),
    );
  }
}
