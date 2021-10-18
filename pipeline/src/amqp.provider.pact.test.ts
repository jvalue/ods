import path from 'path';

import { AmqpConnection } from '@jvalue/node-dry-amqp';
import { readEnvOrDie } from '@jvalue/node-dry-basics';
import { PostgresClient } from '@jvalue/node-dry-pg';
import { MessageProviderPact } from '@pact-foundation/pact';
import * as AMQP from 'amqplib';

import {
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
  AMQP_URL,
  CONNECTION_BACKOFF,
  CONNECTION_RETRIES,
} from './env';
import * as EventPublisher from './pipeline-config/outboxEventPublisher';
import { init } from './pipeline-config/pipelineDatabase';

const AMQP_PIPELINE_EXECUTION_EXCHANGE = readEnvOrDie(
  'AMQP_PIPELINE_EXECUTION_EXCHANGE',
);
const AMQP_PIPELINE_EXECUTION_QUEUE = readEnvOrDie(
  'AMQP_PIPELINE_EXECUTION_QUEUE',
);

const AMQP_PIPELINE_CONFIG_EXCHANGE = readEnvOrDie(
  'AMQP_PIPELINE_CONFIG_EXCHANGE',
);
const AMQP_PIPELINE_CONFIG_QUEUE = readEnvOrDie('AMQP_PIPELINE_CONFIG_QUEUE');

describe('Pact Provider Verification', () => {
  const pact = new MessageProviderPact({
    provider: 'Provider Service',
    pactUrls: [
      path.resolve(process.cwd(), '..', 'pacts', 'notification-pipeline.json'),
      path.resolve(process.cwd(), '..', 'pacts', 'storage-pipeline.json'),
    ],
    logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
    stateHandlers: {
      'any state': async (): Promise<void> => Promise.resolve(),
    },
    messageProviders: {
      'a success event': provideSuccessEvent,
      'a creation event': provideCreationEvent,
      'a deletion event': provideDeletionEvent,
    },
  });

  let pgClient: PostgresClient;
  let amqpConnection: AmqpConnection;

  const successMessages: unknown[] = [];
  const creationMessages: unknown[] = [];
  const deletionMessages: unknown[] = [];

  beforeAll(async () => {
    // Setup amqp consumer to collect the messages that are published to the message-broker by the pipeline outboxer
    pgClient = await init(CONNECTION_RETRIES, CONNECTION_BACKOFF);

    amqpConnection = new AmqpConnection(
      AMQP_URL,
      CONNECTION_RETRIES,
      CONNECTION_BACKOFF,
      () => {
        console.error('lost connection to AMQP');
        process.exit(1);
      },
    );

    await createAmqpConsumer(
      amqpConnection,
      AMQP_PIPELINE_EXECUTION_EXCHANGE,
      AMQP_PIPELINE_EXECUTION_QUEUE,
      AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
      successMessages,
    );

    await createAmqpConsumer(
      amqpConnection,
      AMQP_PIPELINE_CONFIG_EXCHANGE,
      AMQP_PIPELINE_CONFIG_QUEUE,
      AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
      creationMessages,
    );

    await createAmqpConsumer(
      amqpConnection,
      AMQP_PIPELINE_CONFIG_EXCHANGE,
      AMQP_PIPELINE_CONFIG_QUEUE,
      AMQP_PIPELINE_CONFIG_DELETED_TOPIC,
      deletionMessages,
    );
  });

  it('validates the expectations of the notification service', async () => {
    await pact.verify();
  });

  afterAll(async () => {
    await pgClient.close();
    await amqpConnection.close();
  });

  async function provideSuccessEvent(): Promise<unknown> {
    console.log(`Expecting a success event...`);
    await pgClient.transaction(async (client) => {
      await EventPublisher.publishSuccess(
        client,
        1,
        'some pipeline name',
        {},
        { some: 'schema' },
      );
    });
    return await waitForMessage(successMessages);
  }

  async function provideCreationEvent(): Promise<unknown> {
    console.log(`Expecting a creation event...`);
    await pgClient.transaction(async (client) => {
      await EventPublisher.publishCreation(client, 1, 'some pipeline name');
    });
    return await waitForMessage(creationMessages);
  }

  async function provideDeletionEvent(): Promise<unknown> {
    console.log(`Expecting a deletion event...`);
    await pgClient.transaction(async (client) => {
      await EventPublisher.publishDeletion(client, 1, 'some pipeline name');
    });
    return await waitForMessage(deletionMessages);
  }
});

async function createAmqpConsumer(
  amqpConnection: AmqpConnection,
  exchange: string,
  queue: string,
  topic: string,
  messageBuffer: unknown[],
): Promise<void> {
  const amqpChannel = await amqpConnection.createChannel();

  await amqpChannel.assertExchange(exchange, 'topic');
  await amqpChannel.assertQueue(queue, {
    exclusive: false,
  });
  await amqpChannel.bindQueue(queue, exchange, queue);

  // Consumes the message by pushing it into the passed message buffer
  await amqpChannel.consume(
    queue,
    async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
      if (msg == null) {
        console.error('received an AMQP message that was null');
        process.exit(1);
      }

      if (msg.fields.routingKey === topic) {
        messageBuffer.push(JSON.parse(msg.content.toString()));
      }

      await amqpChannel.ack(msg);
    },
  );
}

// Waits until the passed message buffer contains a message
async function waitForMessage(messageBuffer: unknown[]): Promise<unknown> {
  while (messageBuffer.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return messageBuffer.pop();
}
