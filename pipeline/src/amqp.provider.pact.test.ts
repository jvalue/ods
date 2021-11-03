import path from 'path';

import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp';
import { readEnvOrDie } from '@jvalue/node-dry-basics';
import { PostgresClient } from '@jvalue/node-dry-pg';
import {
  MessageProviderPact,
  PactMessageProviderOptions,
} from '@pact-foundation/pact';
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
  let pgClient: PostgresClient;
  let amqpConnection: AmqpConnection;

  const successMessages: unknown[] = [];

  beforeAll(async () => {
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
  });

  const commonProviderOptions: PactMessageProviderOptions = {
    provider: 'Pipeline',
    logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
    stateHandlers: {
      'any state': async (): Promise<void> => Promise.resolve(),
    },
    messageProviders: {
      'a success event': provideSuccessEvent,
    },
  };

  async function provideSuccessEvent(): Promise<unknown> {
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

  describe('with Notification as consumer', () => {
    it('validates the expectations of the notification service', async () => {
      const notificationPact = new MessageProviderPact({
        ...commonProviderOptions,
        pactUrls: [
          path.resolve(
            process.cwd(),
            '..',
            'pacts',
            'notification-pipeline.json',
          ),
        ],
      });

      await notificationPact.verify();
    });
  });

  describe('with Storage as consumer', () => {
    let creationConsumer: AmqpChannel;
    const creationMessages: unknown[] = [];

    let deletionConsumer: AmqpChannel;
    const deletionMessages: unknown[] = [];

    beforeAll(async () => {
      creationConsumer = await createAmqpConsumer(
        amqpConnection,
        AMQP_PIPELINE_CONFIG_EXCHANGE,
        AMQP_PIPELINE_CONFIG_QUEUE,
        AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
        creationMessages,
      );

      deletionConsumer = await createAmqpConsumer(
        amqpConnection,
        AMQP_PIPELINE_CONFIG_EXCHANGE,
        AMQP_PIPELINE_CONFIG_QUEUE,
        AMQP_PIPELINE_CONFIG_DELETED_TOPIC,
        deletionMessages,
      );
    });

    it('validates the expectations of the storage service', async () => {
      const storagePact = new MessageProviderPact({
        ...commonProviderOptions,
        pactUrls: [
          path.resolve(process.cwd(), '..', 'pacts', 'storage-pipeline.json'),
        ],
        messageProviders: {
          ...commonProviderOptions.messageProviders,
          'a creation event': provideCreationEvent,
          'a deletion event': provideDeletionEvent,
        },
      });

      await storagePact.verify();
    });

    afterAll(async () => {
      await creationConsumer.close();
      await deletionConsumer.close();
    });

    async function provideCreationEvent(): Promise<unknown> {
      await pgClient.transaction(async (client) => {
        await EventPublisher.publishCreation(client, 1, 'some pipeline name');
      });
      return await waitForMessage(creationMessages);
    }

    async function provideDeletionEvent(): Promise<unknown> {
      await pgClient.transaction(async (client) => {
        await EventPublisher.publishDeletion(client, 1, 'some pipeline name');
      });
      return await waitForMessage(deletionMessages);
    }
  });

  afterAll(async () => {
    await pgClient.close();
    await amqpConnection.close();
  });
});

// Sets up an amqp consumer to collect the messages that are published to the message-broker by the pipeline outboxer
async function createAmqpConsumer(
  amqpConnection: AmqpConnection,
  exchange: string,
  queue: string,
  topic: string,
  messageBuffer: unknown[],
): Promise<AmqpChannel> {
  const amqpChannel = await amqpConnection.createChannel();

  await amqpChannel.assertExchange(exchange, 'topic');
  await amqpChannel.assertQueue(queue, {
    exclusive: false,
  });
  await amqpChannel.bindQueue(queue, exchange, topic);

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

  return amqpChannel;
}

// Waits until the passed message buffer contains a message
async function waitForMessage(messageBuffer: unknown[]): Promise<unknown> {
  while (messageBuffer.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return messageBuffer.pop();
}
