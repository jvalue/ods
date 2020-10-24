/* eslint-env jest */

import {
  getAllDatasources, triggerDatasource
} from './api/http/adapter-client'
import DatasourceConfig from './api/datasource-config'
import { sleep } from './sleep'
import Scheduler from './scheduling'
import { DatasourceConfigEvent } from './api/amqp/datasourceConfigConsumer'

jest.mock('./clients/adapter-client')
// Type assertion is ok here, because we have mocked the whole './clients/adapter-client' module
/* eslint-disable @typescript-eslint/consistent-type-assertions */
const mockedGetAllDatasources = getAllDatasources as jest.Mock
const mockedTriggerDatasource = triggerDatasource as jest.Mock
/* eslint-enable @typescript-eslint/consistent-type-assertions */

const CONNECTION_RETRIES = 2
const CONNECTION_BACKOFF_IN_MS = 1000
const TRIGGER_RETRIES = 3

jest.mock('./env', () => () => ({
  MAX_TRIGGER_RETRIES: 2
}))
mockedTriggerDatasource.mockReturnValue(Promise.resolve())

let scheduler: Scheduler

describe('Scheduler', () => {
  beforeEach(async () => {
    scheduler = new Scheduler(TRIGGER_RETRIES)
  })

  afterEach(async () => {
    mockedTriggerDatasource.mockClear()
  })

  test('should initialize jobs correctly', async () => {
    const config = generateConfig(true, new Date(Date.now() + 500), 6000)
    mockedGetAllDatasources.mockResolvedValue([config])
    await scheduler.initializeJobsWithRetry(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

    await sleep(1000)

    expect(scheduler.getAllJobs()).toHaveLength(1)
    expect(scheduler.getAllJobs()[0].datasourceConfig).toEqual(config)
    expect(mockedGetAllDatasources).toHaveBeenCalledTimes(1)
    expect(mockedTriggerDatasource).toHaveBeenCalledTimes(1)
  })

  test('should apply creation event', async () => {
    mockedGetAllDatasources.mockResolvedValue([])
    const toBeAdded = generateConfig(true, new Date(Date.now() + 500), 6000)
    const creationEvent: DatasourceConfigEvent = {
      datasource: toBeAdded
    }

    await scheduler.applyCreateOrUpdateEvent(creationEvent)

    await sleep(500)

    expect(scheduler.getAllJobs()).toHaveLength(1)
    const job123 = scheduler.getJob(123)
    expect(job123).toBeDefined()
    // @ts-expect-error
    expect(job123.datasourceConfig).toEqual(toBeAdded)
    expect(mockedTriggerDatasource).toHaveBeenCalledTimes(1)
  })

  test('should apply deletion event', async () => {
    const toBeDeleted = generateConfig(true, new Date(Date.now() + 500), 1000)
    mockedGetAllDatasources.mockResolvedValue([toBeDeleted])
    await scheduler.initializeJobsWithRetry(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

    const deletionEvent: DatasourceConfigEvent = {
      datasource: toBeDeleted
    }
    await scheduler.applyDeleteEvent(deletionEvent)

    await sleep(1000)

    expect(scheduler.getAllJobs()).toHaveLength(0)
    expect(mockedTriggerDatasource).toHaveBeenCalledTimes(0)
  })

  test('should apply update event', async () => {
    const toBeUpdated = generateConfig(true, new Date(Date.now() + 5000), 6000)
    mockedGetAllDatasources.mockResolvedValue([toBeUpdated])

    await scheduler.initializeJobsWithRetry(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

    const updated = generateConfig(false, new Date(Date.now() + 5000), 12000)

    const updateEvent: DatasourceConfigEvent = {
      datasource: updated
    }

    await scheduler.applyCreateOrUpdateEvent(updateEvent)

    expect(scheduler.getAllJobs()).toHaveLength(1)
    const job123 = scheduler.getJob(123)
    expect(job123).toBeDefined()
    // @ts-expect-error
    expect(job123.datasourceConfig).toEqual(updated)
  })

  test('should determine correct execution date from timestamp in the future ', () => {
    const timestampInFuture = Date.now() + 6000
    const datasourceConfig = generateConfig(true, new Date(timestampInFuture), 6000)
    expect(scheduler.determineExecutionDate(datasourceConfig).getTime()).toEqual(timestampInFuture)
  })

  test('should determine correct execution date from timestamp in the past', () => {
    const timestampInPast = Date.now() - 5000
    const interval = 10000

    const datasourceConfig = generateConfig(true, new Date(timestampInPast), interval)
    const expectedExecution = new Date(timestampInPast + interval)
    expect(scheduler.determineExecutionDate(datasourceConfig)).toEqual(expectedExecution)
  })

  test('should determine correct execution date from timestamp in the past [> 24h]', () => {
    const oneDayhInMs = 1000 * 3600 * 24
    const threeDaysInMs = oneDayhInMs * 3
    const fiveMinutesInMs = 1000 * 60 * 5
    const now = Date.now()

    const timestampInPast = now - threeDaysInMs - fiveMinutesInMs
    const interval = oneDayhInMs

    const datasourceConfig = generateConfig(true, new Date(timestampInPast), interval)
    const expectedExecution = new Date(now + interval - fiveMinutesInMs)
    expect(scheduler.determineExecutionDate(datasourceConfig)).toEqual(expectedExecution)
  })

  test('should insert new datasource', async () => {
    const timestampInFuture = Date.now() + 5000
    const datasourceConfig = generateConfig(true, new Date(timestampInFuture), 10000)
    const datasourceJob = await scheduler.upsertJob(datasourceConfig)

    expect(datasourceJob.datasourceConfig).toEqual(datasourceConfig)
    expect(datasourceJob.scheduleJob).toBeDefined()
    expect(scheduler.getJob(datasourceConfig.id)).toEqual(datasourceJob)
  })

  test('should update existing datasource', async () => {
    const timestampInFuture1 = Date.now() + 5000
    const timestampInFuture2 = Date.now() + 100000
    const datasourceConfig1 = generateConfig(true, new Date(timestampInFuture1), 10000)

    const datasourceJob1 = await scheduler.upsertJob(datasourceConfig1)
    expect(scheduler.existsJob(datasourceConfig1.id)).toBeTruthy()

    const datasourceConfig2 = generateConfig(true, new Date(timestampInFuture2), 10000)
    await scheduler.upsertJob(datasourceConfig2)

    expect(scheduler.existsJob(datasourceConfig1.id)).toBeTruthy()
    expect(scheduler.existsEqualJob(datasourceConfig2)).toBeTruthy()
    expect(scheduler.existsEqualJob(datasourceConfig1)).toBeFalsy()

    expect(datasourceJob1).not.toEqual(datasourceConfig2)
  })

  test('should be equal', async () => {
    const timestampInFuture = Date.now() + 5000
    const datasourceConfig1 = generateConfig(true, new Date(timestampInFuture), 10000)
    const datasourceJob1 = await scheduler.upsertJob(datasourceConfig1)
    const datasourceConfig2 = generateConfig(true, new Date(timestampInFuture), 10000)

    expect(scheduler.existsEqualJob(datasourceConfig2)).toBeTruthy()
    expect(scheduler.existsEqualJob(datasourceConfig1)).toBeTruthy()

    expect(datasourceJob1).not.toEqual(datasourceConfig2)
  })

  test('should execute datasource once', async () => {
    const timestampInFuture = Date.now() + 200
    const datasourceConfig = generateConfig(false, new Date(timestampInFuture), 500)
    await scheduler.upsertJob(datasourceConfig)
    expect(scheduler.getJob(datasourceConfig.id)).not.toBeUndefined()
    await sleep(250)

    expect(scheduler.getJob(datasourceConfig.id)).toBeUndefined() // executed once and not rescheduled
    expect(mockedTriggerDatasource).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    scheduler.cancelAllJobs()
  })

  test('should execute datasource periodic', async () => {
    const timestampInFuture = Date.now() + 200
    const datasourceConfig = generateConfig(true, new Date(timestampInFuture), 100)
    const datasourceJob1 = await scheduler.upsertJob(datasourceConfig)
    const nextInvocation1: Date = datasourceJob1.scheduleJob.nextInvocation()
    await sleep(250)
    const datasourceJob2 = scheduler.getJob(datasourceConfig.id)
    const nextInvocation2: Date = datasourceJob1.scheduleJob.nextInvocation()

    expect(nextInvocation1).not.toEqual(nextInvocation2)
    expect(datasourceJob2).toBeDefined()
    // @ts-expect-error
    expect(datasourceJob1.datasourceConfig).toEqual(datasourceJob2.datasourceConfig)
    await sleep(250)
    expect(mockedTriggerDatasource.mock.calls.length).toBeGreaterThan(1)
  })
})

function generateConfig (periodic: boolean, firstExecution: Date, interval: number): DatasourceConfig {
  return {
    id: 123,
    trigger: {
      periodic: periodic,
      firstExecution: firstExecution,
      interval: interval
    }
  }
}
