import { PostgresClient } from '@jvalue/node-dry-pg';
import { PoolConfig } from 'pg';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_USER,
} from '../../env';
import {createOutboxTable} from "./outboxRepository";


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

export async function initOutboxDatabase(
  retries: number,
  backoffMs: number,
): Promise<PostgresClient> {
  const postgresClient = new PostgresClient(POOL_CONFIG);
  await postgresClient.waitForConnection(retries, backoffMs);
  await postgresClient.transaction(async (client) => {
    await createOutboxTable(client);
  });
  return postgresClient;
}
