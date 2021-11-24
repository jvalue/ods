import { Server } from 'http';

import { AmqpConnection } from '@jvalue/node-dry-amqp';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import { createDatasourceExecutionConsumer } from './api/amqp/datasourceExecutionConsumer';
import { PipelineConfigEndpoint } from './api/rest/pipelineConfigEndpoint';
import { PipelineExecutionEndpoint } from './api/rest/pipelineExecutionEndpoint';
import { PipelineTranformedDataEndpoint } from './api/rest/pipelineTransformedDataEndpoint';
import { AMQP_URL, CONNECTION_BACKOFF, CONNECTION_RETRIES } from './env';
import { PipelineConfigManager } from './pipeline-config/pipelineConfigManager';
import { init as initDatabase } from './pipeline-config/pipelineDatabase';
import { PipelineTransformedDataManager } from './pipeline-config/pipelineTransformedDataManager';
import PipelineExecutor from './pipeline-execution/pipelineExecutor';
import VM2SandboxExecutor from './pipeline-execution/sandbox/vm2SandboxExecutor';
import JsonSchemaValidator from './pipeline-validator/jsonSchemaValidator';

export const port = 8080;
export let server: Server | undefined;

function onAmqpConnectionLoss(error: unknown): never {
  console.log('Terminating because connection to AMQP lost:', error);
  process.exit(1);
}

process.on('SIGTERM', () => {
  console.info('Tramsformation-Service: SIGTERM signal received.');
  server?.close();
});

async function main(): Promise<void> {
  const sandboxExecutor = new VM2SandboxExecutor();
  const pipelineExecutor = new PipelineExecutor(sandboxExecutor);

  const postgresClient = await initDatabase(
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
  );

  const validator = new JsonSchemaValidator();

  const pipelineTransformedDataManager = new PipelineTransformedDataManager(
    postgresClient,
  );

  const pipelineConfigManager = new PipelineConfigManager(
    postgresClient,
    pipelineExecutor,
    pipelineTransformedDataManager,
    validator,
  );

  const amqpConnection = new AmqpConnection(
    AMQP_URL,
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
    onAmqpConnectionLoss,
  );
  await createDatasourceExecutionConsumer(
    amqpConnection,
    pipelineConfigManager,
  );

  const pipelineExecutionEndpoint = new PipelineExecutionEndpoint(
    pipelineExecutor,
  );
  const pipelineConfigEndpoint = new PipelineConfigEndpoint(
    pipelineConfigManager,
  );
  const pipelineTransformedDataEndpoint = new PipelineTranformedDataEndpoint(
    pipelineTransformedDataManager,
  );

  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  pipelineExecutionEndpoint.registerRoutes(app);
  pipelineConfigEndpoint.registerRoutes(app);
  pipelineTransformedDataEndpoint.registerRoutes(app);

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!');
  });

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(pipelineExecutor.getVersion());
  });

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error(`Failed to start pipeline service: `, error);
});
