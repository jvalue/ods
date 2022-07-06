import { PostgresClient } from '@jvalue/node-dry-pg';
import { PoolConfig, QueryResult } from 'pg';

import { DataImportResponse } from '../../adapter/model/DataImportResponse';
import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_SCHEMA,
  POSTGRES_USER,
} from '../../env';
import { OutboxEvent } from '../model/outboxEvent';
import { ErrorResponse } from '../services/ErrorResponse';

import { OutboxRepository } from './outboxRepository';

const TABLE_NAME = 'outbox';

const CREATE_OUTBOX_TABLE_STATEMENT = `
CREATE TABLE IF NOT EXISTS "${POSTGRES_SCHEMA}"."${TABLE_NAME}"(
  id uuid NOT NULL CONSTRAINT "Data_pk_${POSTGRES_SCHEMA}_${TABLE_NAME}" PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_key varchar(255) NOT NULL,
  payload jsonb NOT NULL
);
`;
const INSERT_EVENT_STATEMENT = `
INSERT INTO "${POSTGRES_SCHEMA}"."${TABLE_NAME}"
  ("routing_key", "payload")
  VALUES ($1, $2)
  RETURNING id
`;
/*
Const CREATE_OUTBOX_REPOSITORY_STATEMENT = `
CREATE TABLE IF NOT EXISTS public.outbox
(
    id uuid NOT NULL,
    payload jsonb NOT NULL,
    routing_key character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT outbox_pkey PRIMARY KEY (id)
)`;*/

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

export class PostgresOutboxRepository implements OutboxRepository {
  private readonly postgresClient = new PostgresClient(POOL_CONFIG);
  /**
   * Initializes the connection to the database.
   * @param retries:  Number of retries to connect to the database
   * @param backoffMs:  Time in seconds to backoff before next connection retry
   */
  async init(retries: number, backoffMs: number): Promise<void> {
    console.debug('Initializing PostgresDataImportRepository');

    await this.postgresClient.waitForConnection(retries, backoffMs);
    await this.postgresClient.executeQuery(CREATE_OUTBOX_TABLE_STATEMENT);
  }

  async publishToOutbox(routingKey: string, payload: unknown): Promise<string> {
    const resultSet = (await this.postgresClient.executeQuery(
      INSERT_EVENT_STATEMENT,
      [routingKey, payload],
    )) as QueryResult<{ id: string }>;
    if (resultSet.rowCount === 0) {
      throw Error(
        `Could not create outbox event: ${JSON.stringify({
          payload: payload,
          routing_key: routingKey,
        })}`,
      );
    }

    return resultSet.rows[0].id;
  }

  async publishErrorImportTriggerResults(
    routingKey: string,
    datasourceId: number,
    returnErrorResponse: ErrorResponse,
  ): Promise<string> {
    const payload = {
      datasourceId: datasourceId,
      data: JSON.stringify(returnErrorResponse.error),
    };
    return this.publishToOutbox(routingKey, payload);
  }
  async publishImportTriggerResults(
    routingKey: string,
    dataSourceId: number,
    returnDataImportResponse: DataImportResponse,
  ): Promise<string> {
    const payload = {
      datasourceId: dataSourceId,
      data: JSON.stringify(returnDataImportResponse.data),
    };
    return this.publishToOutbox(routingKey, payload);
  }
}

export const initOutboxRepository = async (
  retries: number,
  backkoffMs: number,
): Promise<OutboxRepository> => {
  const outboxRepository: PostgresOutboxRepository =
    new PostgresOutboxRepository();
  await outboxRepository.init(retries, backkoffMs);
  return outboxRepository;
};
