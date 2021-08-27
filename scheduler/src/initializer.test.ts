/* eslint-env jest */
import { mocked } from 'ts-jest/utils';

import { getAllDatasources } from './api/http/adapter-client';
import { setupInitialStateWithRetry } from './initializer';
import Scheduler from './scheduling';

jest.mock('./api/http/adapter-client');
const mockedGetAllDatasources = mocked(getAllDatasources);

jest.mock('./env', () => ({ MAX_TRIGGER_RETRIES: 2 }));

const CONNECTION_RETRIES = 2;
const CONNECTION_BACKOFF_IN_MS = 1000;
const TRIGGER_RETRIES = 3;

let scheduler: Scheduler;

describe('Scheduler initializer', () => {
  beforeEach(() => {
    scheduler = new Scheduler(TRIGGER_RETRIES);
  });

  afterEach(() => {
    scheduler.removeAllJobs();
  });

  test('should initialize jobs correctly', async () => {
    const config = {
      id: 123,
      trigger: {
        periodic: false,
        firstExecution: new Date(),
        interval: 60000,
      },
    };
    mockedGetAllDatasources.mockResolvedValue([config]);

    await setupInitialStateWithRetry(scheduler, CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS);
    expect(scheduler.getAllJobs()).toHaveLength(1);
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);
  });
});
