import { Server } from 'http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import { AdapterEndpoint } from './adapter/api/rest/adapterEndpoint';
import { DataImportEndpoint } from './datasource/api/rest/dataImportEndpoint';
import { DataSourceEndpoint } from './datasource/api/rest/dataSourceEndpoint';
import {AmqpConnection} from "@jvalue/node-dry-amqp";
import {createDataSourceAmqpConsumer} from "./datasource/api/amqp/amqpConsumer";

export const port = 8080;
export let server: Server | undefined;

// Await will be needed in the future, so for now ignore this linter issue and remove the disable later
// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!');
  });
  const amqpConnection = new AmqpConnection(
    // AMQP_URL,
    // CONNECTION_RETRIES,
    // CONNECTION_BACKOFF,
    // onAmqpConnectionLoss,
    "amqp://rabbit_adm:R4bb!7_4DM_p4SS@localhost:5672",
    30,
    2000,
    onAmqpConnectionLoss
  );
  await createDataSourceAmqpConsumer(
    amqpConnection
  );

  const adapterEndpoint = new AdapterEndpoint();
  adapterEndpoint.registerRoutes(app);
  const dataSourceEndpoint = new DataSourceEndpoint();
  dataSourceEndpoint.registerRoutes(app);
  const dataImportEndpoint = new DataImportEndpoint();
  dataImportEndpoint.registerRoutes(app);

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
