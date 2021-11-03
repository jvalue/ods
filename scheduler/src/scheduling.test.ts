/* eslint-env jest */
import { PostgresClient } from '@jvalue/node-dry-pg';
import { mocked } from 'ts-jest/utils';

import DatasourceConfig from './api/datasource-config';
import * as OutboxEventPublisher from './datasource-trigger/outboxEventPublisher';
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

jest.mock('./datasource-trigger/outboxEventPublisher', () => {
  return {
    publishDatasourceTrigger: jest.fn(),
  };
});

jest.mock('./env', () => ({ MAX_TRIGGER_RETRIES: 2 }));

const TRIGGER_RETRIES = 3;
const outboxEventPublisherMock = mocked(OutboxEventPublisher, true);
const postgresClient = new PostgresClient();

let scheduler: Scheduler;

describe('Scheduler', () => {
  beforeEach(() => {
    scheduler = new Scheduler(postgresClient, TRIGGER_RETRIES);
  });

  afterEach(() => {
    outboxEventPublisherMock.publishDatasourceTrigger.mockClear();
    scheduler.removeAllJobs();
  });

  test('should schedule new periodic datasource and trigger once', async () => {
    const config = generateConfig(true, new Date(Date.now() + 500), 6000);
    const job = scheduler.upsertJob(config);
    expect(job.datasourceConfig).toEqual(config);

    await sleep(1500);

    expect(scheduler.getAllJobs()).toHaveLength(1);
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(1);
  });

  test('should schedule new periodic datasource and trigger multiple times', async () => {
    const config = generateConfig(true, new Date(Date.now() + 500), 1000);
    const job = scheduler.upsertJob(config);
    expect(job.datasourceConfig).toEqual(config);

    await sleep(2000);

    expect(scheduler.getAllJobs()).toHaveLength(1);
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(2);
  });

  test('should schedule new periodic datasource with past execution date and trigger once', async () => {
    const config = generateConfig(true, new Date(Date.now() - 500), 1000);
    const job = scheduler.upsertJob(config);
    expect(job.datasourceConfig).toEqual(config);

    await sleep(1000);

    expect(scheduler.getAllJobs()).toHaveLength(1);
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(1);
  });

  test('should schedule new non periodic datasource and trigger', async () => {
    const config = generateConfig(false, new Date(Date.now() + 500), 500);
    const job = scheduler.upsertJob(config);
    expect(job.datasourceConfig).toEqual(config);
    expect(scheduler.getAllJobs()).toHaveLength(1);
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);

    await sleep(1500);

    expect(scheduler.getAllJobs()).toHaveLength(0);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(1);
  });

  test('should schedule new non periodic datasource with past execution date and trigger', async () => {
    const config = generateConfig(false, new Date(Date.now() - 500), 500);
    const job = scheduler.upsertJob(config);
    expect(job.datasourceConfig).toEqual(config);
    expect(scheduler.getAllJobs()).toHaveLength(1);
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config);

    await sleep(1500);

    expect(scheduler.getAllJobs()).toHaveLength(0);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(1);
  });

  test('should delete job', async () => {
    const config = generateConfig(true, new Date(Date.now() + 500), 1000);
    scheduler.upsertJob(config);

    scheduler.removeJob(123);

    await sleep(1000);

    expect(scheduler.getAllJobs()).toHaveLength(0);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(0);
  });

  test('should apply update event', () => {
    const config = generateConfig(true, new Date(Date.now() + 5000), 6000);
    scheduler.upsertJob(config);

    const updated = generateConfig(false, new Date(Date.now() + 5000), 12000);
    const job = scheduler.upsertJob(updated);
    expect(job.datasourceConfig).toEqual(updated);
    expect(scheduler.getAllJobs()).toHaveLength(1);
  });

  test('should determine correct execution date from timestamp in the future ', () => {
    const timestampInFuture = Date.now() + 6000;
    const datasourceConfig = generateConfig(
      true,
      new Date(timestampInFuture),
      6000,
    );
    expect(
      scheduler.determineExecutionDate(datasourceConfig).getTime(),
    ).toEqual(timestampInFuture);
  });

  test('should determine correct execution date from timestamp in the past', () => {
    const timestampInPast = Date.now() - 5000;
    const interval = 10000;

    const datasourceConfig = generateConfig(
      true,
      new Date(timestampInPast),
      interval,
    );
    const expectedExecution = new Date(timestampInPast + interval);
    expect(scheduler.determineExecutionDate(datasourceConfig)).toEqual(
      expectedExecution,
    );
  });

  test('should determine correct execution date from timestamp in the past [> 24h]', () => {
    const oneDayhInMs = 1000 * 3600 * 24;
    const threeDaysInMs = oneDayhInMs * 3;
    const fiveMinutesInMs = 1000 * 60 * 5;
    const now = Date.now();

    const timestampInPast = now - threeDaysInMs - fiveMinutesInMs;
    const interval = oneDayhInMs;

    const datasourceConfig = generateConfig(
      true,
      new Date(timestampInPast),
      interval,
    );
    const expectedExecution = new Date(now + interval - fiveMinutesInMs);
    expect(scheduler.determineExecutionDate(datasourceConfig)).toEqual(
      expectedExecution,
    );
  });

  test('should insert new datasource', () => {
    const timestampInFuture = Date.now() + 5000;
    const datasourceConfig = generateConfig(
      true,
      new Date(timestampInFuture),
      10000,
    );
    const datasourceJob = scheduler.upsertJob(datasourceConfig);

    expect(datasourceJob.datasourceConfig).toEqual(datasourceConfig);
    expect(datasourceJob.scheduleJob).toBeDefined();
    expect(scheduler.getJob(datasourceConfig.id)).toEqual(datasourceJob);
  });

  test('should update existing datasource', () => {
    const timestampInFuture1 = Date.now() + 5000;
    const timestampInFuture2 = Date.now() + 100000;
    const datasourceConfig1 = generateConfig(
      true,
      new Date(timestampInFuture1),
      10000,
    );

    const datasourceJob1 = scheduler.upsertJob(datasourceConfig1);
    expect(scheduler.existsJob(datasourceConfig1.id)).toBeTruthy();

    const datasourceConfig2 = generateConfig(
      true,
      new Date(timestampInFuture2),
      10000,
    );
    scheduler.upsertJob(datasourceConfig2);

    expect(scheduler.existsJob(datasourceConfig1.id)).toBeTruthy();
    expect(scheduler.existsEqualJob(datasourceConfig2)).toBeTruthy();
    expect(scheduler.existsEqualJob(datasourceConfig1)).toBeFalsy();

    expect(datasourceJob1).not.toEqual(datasourceConfig2);
  });

  test('should be equal', () => {
    const timestampInFuture = Date.now() + 5000;
    const datasourceConfig1 = generateConfig(
      true,
      new Date(timestampInFuture),
      10000,
    );
    const datasourceJob1 = scheduler.upsertJob(datasourceConfig1);
    const datasourceConfig2 = generateConfig(
      true,
      new Date(timestampInFuture),
      10000,
    );

    expect(scheduler.existsEqualJob(datasourceConfig2)).toBeTruthy();
    expect(scheduler.existsEqualJob(datasourceConfig1)).toBeTruthy();

    expect(datasourceJob1).not.toEqual(datasourceConfig2);
  });

  test('should execute datasource once', async () => {
    const timestampInFuture = Date.now() + 200;
    const datasourceConfig = generateConfig(
      false,
      new Date(timestampInFuture),
      500,
    );
    scheduler.upsertJob(datasourceConfig);
    expect(scheduler.getJob(datasourceConfig.id)).not.toBeUndefined();
    await sleep(250);

    expect(scheduler.getJob(datasourceConfig.id)).toBeUndefined(); // Executed once and not rescheduled
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger,
    ).toHaveBeenCalledTimes(1);
  });

  test('should execute datasource periodic', async () => {
    const timestampInFuture = Date.now() + 200;
    const datasourceConfig = generateConfig(
      true,
      new Date(timestampInFuture),
      100,
    );
    const datasourceJob1 = scheduler.upsertJob(datasourceConfig);
    const nextInvocation1: Date = datasourceJob1.scheduleJob.nextInvocation();
    await sleep(250);
    const datasourceJob2 = scheduler.getJob(datasourceConfig.id);
    const nextInvocation2: Date = datasourceJob1.scheduleJob.nextInvocation();

    expect(nextInvocation1).not.toEqual(nextInvocation2);
    expect(datasourceJob2).toBeDefined();
    expect(datasourceJob1.datasourceConfig).toEqual(
      datasourceJob2?.datasourceConfig,
    );
    await sleep(250);
    expect(
      outboxEventPublisherMock.publishDatasourceTrigger.mock.calls.length,
    ).toBeGreaterThan(1);
  });
});

function sleep(timeout: number): Promise<void> {
  const result = new Promise<void>((resolve) => {
    setTimeout(resolve, timeout);
  });
  return result;
}

function generateConfig(
  periodic: boolean,
  firstExecution: Date,
  interval: number,
): DatasourceConfig {
  return {
    id: 123,
    trigger: {
      periodic: periodic,
      firstExecution: firstExecution,
      interval: interval,
    },
  };
}
