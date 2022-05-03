import { v4 as uuidv4 } from 'uuid';

import { OutboxEvent } from '../model/outboxEvent';

import { KnexHelper } from './knexHelper';
import {ClientBase} from "pg";

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: '5432',
    user: 'adapterservice',
    password: 'admin',
    database: 'adapterservice',
    asyncStackTraces: true,
  },
});

const CREATE_OUTBOX_REPOSITORY_STATEMENT = `
CREATE TABLE IF NOT EXISTS public.outbox
(
    id uuid NOT NULL,
    payload jsonb NOT NULL,
    routing_key character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT outbox_pkey PRIMARY KEY (id)
)`;

export async function createOutboxTable(client: ClientBase): Promise<void> {
  await client.query(CREATE_OUTBOX_REPOSITORY_STATEMENT);
}

export class OutboxRepository {
  async publishToOutbox(payload: any, routingKey: string) {
    const id = uuidv4();
    const outboxEvent: OutboxEvent = {
      id: id,
      payload: payload,
      routing_key: routingKey,
    };
    return await knex('public.outbox')
      .insert(outboxEvent)
      .returning('id')
      .then(function (id: any) {
        console.log(id);
        console.log('neuer code geht');
      })
      .catch(function (err: any) {
        console.log(err);
      });
  }
}
