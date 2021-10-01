import { AmqpConnection } from '@jvalue/node-dry-amqp';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import { createPipelineSuccessConsumer } from './api/amqp/pipelineSuccessConsumer';
import { NotificationConfigEndpoint } from './api/rest/notificationConfigEndpoint';
import { NotificationExecutionEndpoint } from './api/rest/notificationExecutionEndpoint';
import { TriggerEventHandler } from './api/triggerEventHandler';
import { AMQP_URL, CONNECTION_BACKOFF, CONNECTION_RETRIES } from './env';
import { initNotificationRepository } from './notification-config/postgresNotificationRepository';
import VM2SandboxExecutor from './notification-execution/condition-evaluation/vm2SandboxExecutor';
import NotificationExecutor from './notification-execution/notificationExecutor';

const port = 8080;

function onAmqpConnectionLoss(error: unknown): never {
  console.log('Terminating because connection to AMQP lost:', error);
  process.exit(1);
}

async function main(): Promise<void> {
  const notificationRepository = await initNotificationRepository(
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
  );
  const sandboxExecutor = new VM2SandboxExecutor();
  const notificationExecutor = new NotificationExecutor(sandboxExecutor);
  const triggerEventHandler = new TriggerEventHandler(
    notificationRepository,
    notificationExecutor,
  );
  const notificationConfigEndpoint = new NotificationConfigEndpoint(
    notificationRepository,
  );
  const notificationExecutionEndpoint = new NotificationExecutionEndpoint(
    triggerEventHandler,
  );

  const amqpConnection = new AmqpConnection(
    AMQP_URL,
    CONNECTION_RETRIES,
    CONNECTION_BACKOFF,
    onAmqpConnectionLoss,
  );
  await createPipelineSuccessConsumer(amqpConnection, triggerEventHandler);

  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  notificationConfigEndpoint.registerRoutes(app);
  notificationExecutionEndpoint.registerRoutes(app);

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.send('I am alive!');
  });

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.send(notificationExecutor.getVersion());
  });

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error(`Failed to start notification service: `, error);
});
