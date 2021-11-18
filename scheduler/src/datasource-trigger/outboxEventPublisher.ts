import { ClientBase } from 'pg';

import { AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC } from '../env';

import { insertEvent } from './outboxEventRepository';

export async function publishDatasourceTrigger(
  client: ClientBase,
  datasourceId: number,
): Promise<string> {
  const content = {
    datasourceId: datasourceId,
  };
  return await insertEvent(
    client,
    AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC,
    content,
  );
}
