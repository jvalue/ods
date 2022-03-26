/* eslint-env jest */
import { PostgresClient } from '@jvalue/node-dry-pg';
import { mocked } from 'ts-jest/utils';

import { getAllDatasources } from './api/http/adapter-client';
import { setupInitialStateWithRetry } from './initializer';
import Scheduler from './scheduling';

jest.mock('@jvalue/node-dry-pg', () => {
  return {
    PostgresClient: jest.fn().mockImplementation(() => {
      return {
        transaction: async (fn: () => Promise<void>): Promise<void> =>
          await fn(),
      };
    }),
  };
});

jest.mock('./api/http/adapter-client');
const mockedGetAllDatasources = mocked(getAllDatasources);

jest.mock('./env', () => ({ MAX_TRIGGER_RETRIES: 2 }));

const CONNECTION_RETRIES = 2;
const CONNECTION_BACKOFF_IN_MS = 1000;
const TRIGGER_RETRIES = 3;
const postgresClient = new PostgresClient();

let scheduler: Scheduler;

describe('Scheduler initializer', () => {
  beforeEach(() => {
    scheduler = new Scheduler(postgresClient, TRIGGER_RETRIES);
  });

  afterEach(() => {
    scheduler.removeAllJobs();
  });

  // test('should initialize jobs correctly', async () => {
  //   const config = {
  //     id: 123,
  //     trigger: {
  //       periodic: false,
  //       firstExecution: new Date(),
  //       interval: 60000,
  //     },
  //   };
  //   mockedGetAllDatasources.mockResolvedValue([config]);

  //   await setupInitialStateWithRetry(
  //     scheduler,
  //     CONNECTION_RETRIES,
  //     CONNECTION_BACKOFF_IN_MS,
  //   );
  //   expect(scheduler.getAllJobs()).toHaveLength(1);
  //   expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);
  // });
});
