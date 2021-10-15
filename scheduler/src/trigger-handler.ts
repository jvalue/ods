import { PostgresClient } from '@jvalue/node-dry-pg';

import * as EventPublisher from './datasource-trigger/outboxEventPublisher';

export async function triggerDatasource(
  pgClient: PostgresClient,
  datasourceId: number,
  triggerRetries: number,
): Promise<void> {
  for (let i = 0; i < triggerRetries; i++) {
    try {
      await pgClient.transaction(
        async (client) =>
          await EventPublisher.publishDatasourceTrigger(client, datasourceId),
      );
      console.log(`Datasource ${datasourceId} triggered.`);
      break;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (i === triggerRetries - 1) {
        // Last retry
        console.error(`Could not trigger datasource ${datasourceId}`);
        break;
      }
      console.info(
        `Triggering datasource failed - retrying (${i}/${triggerRetries})`,
      );
    }
  }
}
