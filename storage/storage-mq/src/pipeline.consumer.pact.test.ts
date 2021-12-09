import * as fs from 'fs';
import path from 'path';

import { Matchers, asynchronousBodyHandler } from '@pact-foundation/pact';
import { JestMessageConsumerOptions, messagePactWith } from 'jest-pact';

import { PipelineConfigEventHandler } from './api/pipelineConfigEventHandler';
import { PipelineExecutionEventHandler } from './api/pipelineExecutionEventHandler';
import {
  examplePipelineCreatedEvent,
  examplePipelineDeletedEvent,
  examplePipelineExecutedEvent,
} from './pipeline.consumer.pact.fixtures';
import { PostgresStorageContentRepository } from './storage-content/postgresStorageContentRepository';
import { PostgresStorageStructureRepository } from './storage-structure/postgresStorageStructureRepository';

const pactsDir = path.resolve(process.cwd(), '..', 'pacts');

const options: JestMessageConsumerOptions = {
  consumer: 'Storage',
  provider: 'Pipeline',
  dir: pactsDir,
  logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),

  // TODO the pactfileWriteMode cannot be set due to an open issue in pact-js: https://github.com/pact-foundation/pact-js/issues/414
  // PactfileWriteMode: 'overwrite'
};
// TODO remove this workaround as soon as the pactfileWriteMode can be set to 'overwrite' in JestMessageConsumerOptions
const contractPath = path.resolve(pactsDir, 'storage-pipeline.json');
if (fs.existsSync(contractPath)) {
  fs.unlinkSync(contractPath);
}

jest.mock('./storage-structure/postgresStorageStructureRepository', () => {
  return {
    PostgresStorageStructureRepository: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn(),
        delete: jest.fn(),
      };
    }),
  };
});

const mockPostgresStorageStructureRepository =
  PostgresStorageStructureRepository as jest.Mock<PostgresStorageStructureRepository>;

jest.mock('./storage-content/postgresStorageContentRepository', () => {
  return {
    PostgresStorageContentRepository: jest.fn().mockImplementation(() => {
      return {
        saveContent: jest.fn(),
      };
    }),
  };
});

const mockPostgresStorageContentRepository =
  PostgresStorageContentRepository as jest.Mock<PostgresStorageContentRepository>;

messagePactWith(options, (messagePact) => {
  describe('receiving an amqp message', () => {
    describe('for pipeline config event handler', () => {
      const pipelineConfigEventHandler = new PipelineConfigEventHandler(
        mockPostgresStorageStructureRepository(),
      );

      it('handles a creation event', async () => {
        await messagePact
          .given('any state')
          .expectsToReceive('a creation event')
          .withContent(Matchers.like(examplePipelineCreatedEvent))
          .verify(
            asynchronousBodyHandler(
              async (body) =>
                await pipelineConfigEventHandler.handleCreation(body),
            ),
          );
      });

      it('handles a deletion event', async () => {
        await messagePact
          .given('any state')
          .expectsToReceive('a deletion event')
          .withContent(Matchers.like(examplePipelineDeletedEvent))
          .verify(
            asynchronousBodyHandler(
              async (body) =>
                await pipelineConfigEventHandler.handleDeletion(body),
            ),
          );
      });
    });

    describe('for pipeline execution event handler', () => {
      const pipelineExecutionEventHandler = new PipelineExecutionEventHandler(
        mockPostgresStorageContentRepository(),
      );

      it('handles a success event', async () => {
        await messagePact
          .given('any state')
          .expectsToReceive('a success event')
          .withContent(Matchers.like(examplePipelineExecutedEvent))
          .verify(
            asynchronousBodyHandler(
              async (body) =>
                await pipelineExecutionEventHandler.handleSuccess(body),
            ),
          );
      });
    });
  });
});
