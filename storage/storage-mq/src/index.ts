import { Server } from 'http';

import { AmqpConnection } from '@jvalue/node-dry-amqp';
import { PostgresClient } from '@jvalue/node-dry-pg';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { PoolConfig } from 'pg';

import { createPipelineConfigEventConsumer } from './api/amqp/pipelineConfigConsumer';
import { createPipelineExecutionEventConsumer } from './api/amqp/pipelineExecutionConsumer';
import { PipelineConfigEventHandler } from './api/pipelineConfigEventHandler';
import { PipelineExecutionEventHandler } from './api/pipelineExecutionEventHandler';
import { StorageContentEndpoint } from './api/rest/storageContentEndpoint';
import {
  AMQP_URL,
  CONNECTION_BACKOFF,
  CONNECTION_RETRIES,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_SSL,
  POSTGRES_USER,
} from './env';
import { PostgresStorageContentRepository } from './storage-content/postgresStorageContentRepository';
import { PostgresStorageStructureRepository } from './storage-structure/postgresStorageStructureRepository';

const port = 8080;

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

let server: Server | undefined;

process.on('SIGTERM', () => {
  console.info('Storage-MQ: SIGTERM signal received.');
  server?.close();
});

function onAmqpConnectionLoss(error: unknown): never {
  console.log('Terminating because connection to AMQP lost:', error);
  process.exit(1);
}

async function main(): Promise<void> {
  const postgresClient = new PostgresClient(POOL_CONFIG);
  const storageContentRepository = new PostgresStorageContentRepository(
    postgresClient,
  );
  const storageStructureRepository = new PostgresStorageStructureRepository(
    postgresClient,
  );

  const pipelineConfigEventHandler = new PipelineConfigEventHandler(
    storageStructureRepository,
  );
  const pipelineExecutionEventHandler = new PipelineExecutionEventHandler(
    storageContentRepository,
  );

  const amqpConnection = new AmqpConnection(
    AMQP_URL,
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
    onAmqpConnectionLoss,
  );
  await Promise.allSettled([
    createPipelineConfigEventConsumer(
      amqpConnection,
      pipelineConfigEventHandler,
    ),
    createPipelineExecutionEventConsumer(
      amqpConnection,
      pipelineExecutionEventHandler,
    ),
  ]);

  const storageContentEndpoint = new StorageContentEndpoint(
    storageContentRepository,
  );

  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  storageContentEndpoint.registerRoutes(app);

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!');
  });

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(storageContentEndpoint.getVersion());
  });

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

main().catch((error) => {
  console.error(`Failed to start storage-mq service: `, error);
});
