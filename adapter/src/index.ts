import { Server } from 'http';

import { AmqpConnection } from '@jvalue/node-dry-amqp';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import { AdapterEndpoint } from './adapter/api/rest/AdapterEndpoint';
import { createDataSourceAmqpConsumer } from './datasource/api/amqp/AmqpConsumer';
import { DataImportEndpoint } from './datasource/api/rest/DataImportEndpoint';
import { DataSourceEndpoint } from './datasource/api/rest/DataSourceEndpoint';
import { DataImportTriggerService } from './datasource/DataImportTriggerService';
import { initDataImportRepository } from './datasource/repository/postgres/PostgresDataImportRepository';
import { initDatasourceRepository } from './datasource/repository/postgres/PostgresDatasourceRepository';
import { initOutboxRepository } from './datasource/repository/postgres/PostgresOutboxRepository';
import { AMQP_URL, CONNECTION_BACKOFF, CONNECTION_RETRIES } from './env';

export const port = 8080;
export let server: Server | undefined;

async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!');
  });

  /* Repositories */
  const outboxRepository = await initOutboxRepository(
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
  );
  const datasourceRepository = await initDatasourceRepository(
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
  );
  const dataImportRepository = await initDataImportRepository(
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
    datasourceRepository,
  );

  const dataImportTriggerService = new DataImportTriggerService(
    datasourceRepository,
    dataImportRepository,
    outboxRepository,
  );

  /* AMQP Consumers */
  const amqpConnection = new AmqpConnection(
    AMQP_URL,
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
    onAmqpConnectionLoss,
  );
  await createDataSourceAmqpConsumer(
    amqpConnection,
    outboxRepository,
    dataImportTriggerService,
  );

  /* Endpoints */
  const adapterEndpoint = new AdapterEndpoint();
  adapterEndpoint.registerRoutes(app);

  const dataSourceEndpoint = new DataSourceEndpoint(
    datasourceRepository,
    outboxRepository,
    dataImportTriggerService,
  );
  dataSourceEndpoint.registerRoutes(app);

  const dataImportEndpoint = new DataImportEndpoint(
    dataImportRepository,
    datasourceRepository,
  );
  dataImportEndpoint.registerRoutes(app);

  /* Start server */
  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error(`Failed to start adapter service: `, error);
});
function onAmqpConnectionLoss(error: unknown): never {
  console.log('Terminating because connection to AMQP lost:', error);
  process.exit(1);
}
