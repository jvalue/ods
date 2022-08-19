import { PostgresClient } from '@jvalue/node-dry-pg';
import { PoolConfig, QueryResult } from 'pg';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_USER,
} from '../../../env';
import { DatasourceEntity } from '../Datasource.entity';
import { DatasourceInsertEntity } from '../DatasourceInsert.entity';
import { DatasourceRepository } from '../DatasourceRepository';

const TABLE_NAME = 'datasource';

const CREATE_DATASOURCE_REPOSITORY_STATEMENT = `
  CREATE TABLE IF NOT EXISTS public.${TABLE_NAME}
(
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    format_parameters character varying(255) COLLATE pg_catalog."default",
    format_type character varying(255) COLLATE pg_catalog."default",
    author character varying(255) COLLATE pg_catalog."default",
    creation_timestamp timestamp without time zone,
    description character varying(255) COLLATE pg_catalog."default",
    display_name character varying(255) COLLATE pg_catalog."default",
    license character varying(255) COLLATE pg_catalog."default",
    protocol_parameters text COLLATE pg_catalog."default",
    protocol_type character varying(255) COLLATE pg_catalog."default",
    schema jsonb,
    first_execution timestamp without time zone,
    "interval" bigint,
    periodic boolean NOT NULL,
    CONSTRAINT datasource_pkey PRIMARY KEY (id)
)`;

const GET_BY_ID = `SELECT * FROM "${TABLE_NAME}" WHERE "id" = $1`;
const GET_ALL = `SELECT * FROM "${TABLE_NAME}"`;
const INSERT = `INSERT INTO "${TABLE_NAME}" ("format_parameters", "format_type", "author", "creation_timestamp", "description", "display_name", "license", "protocol_parameters", "protocol_type", "schema", "first_execution", "interval", "periodic") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`;
const UPDATE = `UPDATE "${TABLE_NAME}" SET "format_parameters"=$2, "format_type"=$3, "author"=$4, "creation_timestamp"=$5, "description"=$6, "display_name"=$7, "license"=$8, "protocol_parameters"=$9, "protocol_type"=$10, "schema"=$11, "first_execution"=$12, "interval"=$13, "periodic"=$14 WHERE "id"=$1 RETURNING *`;
const DELETE = `DELETE FROM "${TABLE_NAME}" WHERE "id"=$1 RETURNING *`;
const DELETE_ALL = `DELETE FROM "${TABLE_NAME}" RETURNING *`;

interface DatabaseDatasourceEntity {
  id: string;
  format_parameters: string;
  format_type: string;
  author: string;
  creation_timestamp: string;
  description: string;
  display_name: string;
  license: string;
  protocol_parameters: string;
  protocol_type: string;
  schema: Record<string, unknown>;
  first_execution: string;
  interval: string;
  periodic: boolean;
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

export class PostgresDatasourceRepository implements DatasourceRepository {
  private readonly postgresClient = new PostgresClient(POOL_CONFIG);

  /**
   * Initializes the connection to the database.
   * @param retries:  Number of retries to connect to the database
   * @param backoffMs:  Time in seconds to backoff before next connection retry
   */
  async init(retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing PostgresDatasourceRepository');

    await this.postgresClient.waitForConnection(retries, backoffMs);
    await this.postgresClient.executeQuery(
      CREATE_DATASOURCE_REPOSITORY_STATEMENT,
    );
  }

  async getById(id: number): Promise<DatasourceEntity | undefined> {
    const resultSet = (await this.postgresClient.executeQuery(GET_BY_ID, [
      id,
    ])) as QueryResult<DatabaseDatasourceEntity>;
    return this.deserializeQueryResult(resultSet)[0];
  }

  async getAll(): Promise<DatasourceEntity[]> {
    const resultSet = (await this.postgresClient.executeQuery(
      GET_ALL,
    )) as QueryResult<DatabaseDatasourceEntity>;
    return this.deserializeQueryResult(resultSet);
  }

  async create(
    insertStatement: DatasourceInsertEntity,
  ): Promise<DatasourceEntity> {
    const values = [
      insertStatement.format_parameters,
      insertStatement.format_type,
      insertStatement.author,
      insertStatement.creation_timestamp,
      insertStatement.description,
      insertStatement.display_name,
      insertStatement.license,
      insertStatement.protocol_parameters,
      insertStatement.protocol_type,
      {},
      insertStatement.first_execution,
      insertStatement.interval,
      insertStatement.periodic,
    ];

    const resultSet = (await this.postgresClient.executeQuery(
      INSERT,
      values,
    )) as QueryResult<DatabaseDatasourceEntity>;
    const entities = this.deserializeQueryResult(resultSet);
    if (entities.length === 0) {
      throw Error(
        `Could not create datasource: ${JSON.stringify(insertStatement)}`,
      );
    }

    return entities[0];
  }

  async update(
    id: number,
    insertStatement: DatasourceInsertEntity,
  ): Promise<DatasourceEntity> {
    const values = [
      id,
      insertStatement.format_parameters,
      insertStatement.format_type,
      insertStatement.author,
      insertStatement.creation_timestamp,
      insertStatement.description,
      insertStatement.display_name,
      insertStatement.license,
      insertStatement.protocol_parameters,
      insertStatement.protocol_type,
      {},
      insertStatement.first_execution,
      insertStatement.interval,
      insertStatement.periodic,
    ];

    const resultSet = (await this.postgresClient.executeQuery(
      UPDATE,
      values,
    )) as QueryResult<DatabaseDatasourceEntity>;
    const entities = this.deserializeQueryResult(resultSet);
    if (entities.length === 0) {
      throw Error(
        `Could not update datasource: ${JSON.stringify(insertStatement)}`,
      );
    }

    return entities[0];
  }

  async delete(id: number): Promise<void> {
    const resultSet = (await this.postgresClient.executeQuery(DELETE, [
      id,
    ])) as QueryResult<DatabaseDatasourceEntity>;

    if (resultSet.rowCount === 0) {
      throw Error(`Could not delete datasource with id ${id}`);
    }
  }

  async deleteAll(): Promise<void> {
    const resultSet = (await this.postgresClient.executeQuery(
      DELETE_ALL,
      [],
    )) as QueryResult<DatabaseDatasourceEntity>;

    if (resultSet.rowCount === 0) {
      throw Error(`Could not delete all datasources`);
    }
  }

  private escapeQuotes(data: unknown): string {
    return JSON.stringify(data).replace("'", "''");
  }

  private deserializeQueryResult(
    resultSet: QueryResult<DatabaseDatasourceEntity>,
  ): DatasourceEntity[] {
    const contents: DatabaseDatasourceEntity[] = resultSet.rows;
    const entitiesUntyped = contents.map((x) => {
      return {
        ...x,
        id: Number.parseInt(x.id, 10),
        creation_timestamp: new Date(x.creation_timestamp),
        first_execution: new Date(x.first_execution),
        interval: Number.parseInt(x.interval, 10),
      };
    });

    return entitiesUntyped;
  }
}

export const initDatasourceRepository = async (
  retries: number,
  backkoffMs: number,
): Promise<DatasourceRepository> => {
  const datasourceRepository: PostgresDatasourceRepository =
    new PostgresDatasourceRepository();
  await datasourceRepository.init(retries, backkoffMs);
  return datasourceRepository;
};
