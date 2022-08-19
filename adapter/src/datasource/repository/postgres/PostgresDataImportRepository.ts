import { PostgresClient } from '@jvalue/node-dry-pg';
import { PoolConfig, QueryResult } from 'pg';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_USER,
} from '../../../env';
import { DataImportEntity } from '../DataImport.entity';
import { DataImportInsertEntity } from '../DataImportInsert.entity';
import { DataImportRepository } from '../DataImportRepository';
import { DatasourceRepository } from '../DatasourceRepository';

const TABLE_NAME = 'data_import';

const CREATE_DATAIMPORT_REPOSITORY_STATEMENT = `
  CREATE TABLE IF NOT EXISTS public.${TABLE_NAME}
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    data bytea,
    error_messages text[] COLLATE pg_catalog."default",
    health character varying(255) COLLATE pg_catalog."default",
    "timestamp" timestamp without time zone,
    datasource_id bigint,
    CONSTRAINT data_import_pkey PRIMARY KEY (id),
    CONSTRAINT fkdhr9x05byn63qfej3i1vw975a FOREIGN KEY (datasource_id)
        REFERENCES public.datasource (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    parameters character varying(255) COLLATE pg_catalog."default"
)`;

const GET_BY_ID = `SELECT * FROM "${TABLE_NAME}" WHERE "id" = $1`;
const GET_METADATA_IMPORT_BY_DATASOURCE_ID = `SELECT * FROM "${TABLE_NAME}" WHERE "datasource_id" = $1`;
const GET_LATEST_METADATA_IMPORT_BY_DATASOURCE_ID = `SELECT * FROM "${TABLE_NAME}" WHERE "datasource_id" = $1 ORDER BY "timestamp" DESC`;
const INSERT_STATEMENT = `INSERT INTO "${TABLE_NAME}" ("data", "error_messages", "health", "timestamp", "datasource_id", "parameters") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

interface DatabaseDataImportEntity {
  id: string;
  error_messages: string[];
  health: string;
  timestamp: string;
  datasource_id: string;
  data: unknown;
  parameters: string;
}

const POOL_CONFIG: PoolConfig = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT as unknown as number,
  user: POSTGRES_USER,
  password: POSTGRES_PW,
  database: POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export class PostgresDataImportRepository implements DataImportRepository {
  private readonly postgresClient = new PostgresClient(POOL_CONFIG);

  constructor(private readonly datasourceRepository: DatasourceRepository) {}

  /**
   * Initializes the connection to the database.
   * @param retries:  Number of retries to connect to the database
   * @param backoffMs:  Time in seconds to backoff before next connection retry
   */
  async init(retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing PostgresDataImportRepository');

    await this.postgresClient.waitForConnection(retries, backoffMs);
    await this.postgresClient.executeQuery(
      CREATE_DATAIMPORT_REPOSITORY_STATEMENT,
    );
  }

  async getByDatasourceId(datasourceId: number): Promise<DataImportEntity[]> {
    const resultSet = (await this.postgresClient.executeQuery(
      GET_METADATA_IMPORT_BY_DATASOURCE_ID,
      [datasourceId],
    )) as QueryResult<DatabaseDataImportEntity>;
    return this.deserializeQueryResult(resultSet);
  }

  async getLatestByDatasourceId(id: number): Promise<DataImportEntity> {
    const resultSet = (await this.postgresClient.executeQuery(
      GET_LATEST_METADATA_IMPORT_BY_DATASOURCE_ID,
      [id],
    )) as QueryResult<DatabaseDataImportEntity>;
    return this.deserializeQueryResult(resultSet)[0];
  }

  // TODO old impl queried by both dataImportId and datasourceId -> WHY?!?!!?!? (both are unique -> only one dataImportId IN WHOLE TABLE)
  async getById(dataImportId: number): Promise<DataImportEntity | undefined> {
    const resultSet = (await this.postgresClient.executeQuery(GET_BY_ID, [
      dataImportId,
    ])) as QueryResult<DatabaseDataImportEntity>;
    return this.deserializeQueryResult(resultSet)[0];
  }

  async create(
    insertStatement: DataImportInsertEntity,
  ): Promise<DataImportEntity> {
    const parameter = this.escapeQuotes(insertStatement.parameters);
    const values = [
      insertStatement.data,
      insertStatement.error_messages,
      insertStatement.health,
      insertStatement.timestamp,
      insertStatement.datasource_id,
      parameter,
    ];

    const resultSet = (await this.postgresClient.executeQuery(
      INSERT_STATEMENT,
      values,
    )) as QueryResult<DatabaseDataImportEntity>;
    const entities = this.deserializeQueryResult(resultSet);
    if (entities.length === 0) {
      throw Error(
        `Could not create data import: ${JSON.stringify(insertStatement)}`,
      );
    }

    return entities[0];
  }

  private escapeQuotes(data: unknown): string {
    if (data !== undefined) {
      return JSON.stringify(data).replace("'", "''");
    }
    return '';
  }

  private deserializeQueryResult(
    resultSet: QueryResult<DatabaseDataImportEntity>,
  ): DataImportEntity[] {
    const contents: DatabaseDataImportEntity[] = resultSet.rows;
    const entitiesUntyped = contents.map((x) => {
      return {
        ...x,
        id: Number.parseInt(x.id, 10),
        datasource_id: Number.parseInt(x.datasource_id, 10),
        timestamp: new Date(x.timestamp),
      } as DataImportEntity;
    });

    return entitiesUntyped;
  }
}

export const initDataImportRepository = async (
  retries: number,
  backkoffMs: number,
  datasourceRepository: DatasourceRepository,
): Promise<DataImportRepository> => {
  const dataImportRepository: PostgresDataImportRepository =
    new PostgresDataImportRepository(datasourceRepository);
  await dataImportRepository.init(retries, backkoffMs);
  return dataImportRepository;
};
