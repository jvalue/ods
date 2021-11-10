import { PostgresClient } from '@jvalue/node-dry-pg';
import { PoolConfig } from 'pg';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_SSL,
  POSTGRES_USER,
} from '../env';

import { createSchedulerEventTable } from './outboxEventRepository';

const POOL_CONFIG: PoolConfig = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PW,
  database: POSTGRES_DB,
  ssl: POSTGRES_SSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export async function init(
  retries: number,
  backoffMs: number,
): Promise<PostgresClient> {
  const postgresClient = new PostgresClient(POOL_CONFIG);
  await postgresClient.waitForConnection(retries, backoffMs);
  await postgresClient.transaction(async (client) => {
    await createSchedulerEventTable(client);
  });
  return postgresClient;
}
