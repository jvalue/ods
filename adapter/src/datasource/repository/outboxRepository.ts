import { ClientBase } from 'pg';
import { v4 as uuidv4 } from 'uuid';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_USER,
} from '../../env';
import { OutboxEvent } from '../model/outboxEvent';
import {DataImportResponse} from "../../adapter/model/DataImportResponse";

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PW,
    database: POSTGRES_DB,
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

  async publishImportTriggerResults(dataSourceId: Number, returnDataImportResponse: DataImportResponse, routingKey: string) {
    const id = uuidv4();
    let payload={
      datasourceId:dataSourceId,
      data: returnDataImportResponse.data
    }
    let importTriggerOutboxEvent:OutboxEvent={
      id:id,
      payload: payload,
      routing_key: routingKey,
    };

    return await knex('public.outbox')
      .insert(importTriggerOutboxEvent)
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
