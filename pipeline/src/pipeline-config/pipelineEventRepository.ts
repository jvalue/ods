import { ClientBase } from 'pg'

import { POSTGRES_SCHEMA } from '../env'

const OUTBOX_TABLE_NAME = 'outbox'

const CREATE_OUTBOX_TABLE_STATEMENT = `
CREATE TABLE IF NOT EXISTS "${POSTGRES_SCHEMA}"."${OUTBOX_TABLE_NAME}"(
  id uuid NOT NULL CONSTRAINT "Data_pk_${POSTGRES_SCHEMA}_${OUTBOX_TABLE_NAME}" PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_key varchar(255) NOT NULL,
  payload jsonb NOT NULL
);
`
const INSERT_EVENT_STATEMENT = `
INSERT INTO "${POSTGRES_SCHEMA}"."${OUTBOX_TABLE_NAME}"
  ("routing_key", "payload")
  VALUES ($1, $2)
  RETURNING id
`

export async function createPipelineEventTable (client: ClientBase): Promise<void> {
  await client.query(CREATE_OUTBOX_TABLE_STATEMENT)
}

export async function insertEvent (client: ClientBase, routingKey: string, payload: unknown): Promise<string> {
  const { rows } = await client.query(INSERT_EVENT_STATEMENT, [routingKey, payload])
  return rows[0].id
}
