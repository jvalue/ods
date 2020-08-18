/* eslint-env jest */

import * as Scheduling from './scheduling'
import {
  getLatestEventId,
  getAllDatasources,
  getEventsAfter, getDatasource
} from './clients/adapter-client'
import { EventType } from './interfaces/datasource-event'
import DatasourceConfig from './interfaces/datasource-config'

jest.mock('./clients/adapter-client')
const mockedGetLatestEventId = getLatestEventId as jest.Mock
mockedGetLatestEventId.mockResolvedValue(321)
const mockedGetAllDatasources = getAllDatasources as jest.Mock
const mockedGetEventsAfter = getEventsAfter as jest.Mock
const mockedGetDatasource = getDatasource as jest.Mock

jest.mock('./env', () => () => ({
  MAX_TRIGGER_RETRIES: 2
}))

describe('Scheduler', () => {
  test('should initialize jobs correctly', async () => {
    const config = generateConfig(true, new Date(Date.now() + 5000), 6000)
    mockedGetAllDatasources.mockResolvedValue([config])

    await Scheduling.initializeJobs()

    expect(Scheduling.getAllJobs()).toHaveLength(1)
    expect(Scheduling.getAllJobs()[0].datasourceConfig).toEqual(config)
  })

  test('should apply creation event', async () => {
    mockedGetAllDatasources.mockResolvedValue([])
    const toBeAdded = generateConfig(true, new Date(Date.now() + 5000), 6000)
    const creationEvent = {
      eventId: 322,
      eventType: EventType.DATASOURCE_CREATE,
      datasourceId: 123
    }

    await Scheduling.initializeJobs()
    expect(Scheduling.getAllJobs()).toHaveLength(0)

    mockedGetEventsAfter.mockResolvedValue([creationEvent])
    mockedGetDatasource.mockResolvedValue(toBeAdded)
    await Scheduling.updateDatasources()

    await sleep(1000) // Give the scheduler some time to apply the update

    expect(Scheduling.getAllJobs()).toHaveLength(1)
    const job123 = Scheduling.getJob(123)
    expect(job123).toBeDefined()
    if (job123 !== undefined) {
      expect(job123.datasourceConfig).toEqual(toBeAdded)
    }
  })

  test('should apply deletion event', async () => {
    const toBeDeleted = generateConfig(true, new Date(Date.now() + 5000), 6000)
    mockedGetAllDatasources.mockResolvedValue([toBeDeleted])
    const deletionEvent = {
      eventId: 323,
      eventType: EventType.DATASOURCE_DELETE,
      datasourceId: 123
    }

    await Scheduling.initializeJobs()
    expect(Scheduling.getAllJobs()).toHaveLength(1)

    mockedGetEventsAfter.mockResolvedValue([deletionEvent])
    mockedGetDatasource.mockResolvedValue(toBeDeleted)
    await Scheduling.updateDatasources()

    await sleep(1000) // Give the scheduler some time to apply the update

    expect(Scheduling.getAllJobs()).toHaveLength(0)
  })

  test('should apply update event', async () => {
    const toBeUpdated = generateConfig(true, new Date(Date.now() + 5000), 6000)
    mockedGetAllDatasources.mockResolvedValue([toBeUpdated])
    const updateEvent = {
      eventId: 324,
      eventType: EventType.DATASOURCE_UPDATE,
      datasourceId: 123
    }

    await Scheduling.initializeJobs()
    const allJobs = Scheduling.getAllJobs()
    expect(allJobs).toHaveLength(1)
    expect(allJobs[0].datasourceConfig).toEqual(toBeUpdated)

    const updated = generateConfig(false, new Date(Date.now() + 5000), 12000)
    mockedGetEventsAfter.mockResolvedValue([updateEvent])
    mockedGetDatasource.mockResolvedValue(updated)

    await Scheduling.updateDatasources()

    await sleep(1000) // Give the scheduler some time to apply the update

    expect(Scheduling.getAllJobs()).toHaveLength(1)
    const job123 = Scheduling.getJob(123)
    expect(job123).toBeDefined()
    if (job123 !== undefined) {
      expect(job123.datasourceConfig).toEqual(updated)
    }
  })

  test('should determine correct execution date from timestamp in the future ', () => {
    const timestampInFuture = Date.now() + 6000
    const datasourceConfig = generateConfig(true, new Date(timestampInFuture), 6000)
    expect(Scheduling.determineExecutionDate(datasourceConfig).getTime()).toEqual(timestampInFuture)
  })

  test('should determine correct execution date from timestamp in the past', () => {
    const timestampInPast = Date.now() - 5000
    const interval = 10000

    const datasourceConfig = generateConfig(true, new Date(timestampInPast), interval)
    const expectedExecution = new Date(timestampInPast + interval)
    expect(Scheduling.determineExecutionDate(datasourceConfig)).toEqual(expectedExecution)
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
    expect(Scheduling.determineExecutionDate(datasourceConfig)).toEqual(expectedExecution)
  })

  test('should insert new datasource', async () => {
    const timestampInFuture = Date.now() + 5000
    const datasourceConfig = generateConfig(true, new Date(timestampInFuture), 10000)
    const datasourceJob = await Scheduling.upsertJob(datasourceConfig)

    expect(datasourceJob.datasourceConfig).toEqual(datasourceConfig)
    expect(datasourceJob.scheduleJob).toBeDefined()
    expect(Scheduling.getJob(datasourceConfig.id)).toEqual(datasourceJob)
  })

  test('should update existing datasource', async () => {
    const timestampInFuture1 = Date.now() + 5000
    const timestampInFuture2 = Date.now() + 100000
    const datasourceConfig1 = generateConfig(true, new Date(timestampInFuture1), 10000)

    const datasourceJob1 = await Scheduling.upsertJob(datasourceConfig1)
    expect(Scheduling.existsJob(datasourceConfig1.id)).toBeTruthy()

    const datasourceConfig2 = generateConfig(true, new Date(timestampInFuture2), 10000)
    await Scheduling.upsertJob(datasourceConfig2)

    expect(Scheduling.existsJob(datasourceConfig1.id)).toBeTruthy()
    expect(Scheduling.existsEqualJob(datasourceConfig2)).toBeTruthy()
    expect(Scheduling.existsEqualJob(datasourceConfig1)).toBeFalsy()

    expect(datasourceJob1).not.toEqual(datasourceConfig2)
  })

  test('should be equal', async () => {
    const timestampInFuture = Date.now() + 5000
    const datasourceConfig1 = generateConfig(true, new Date(timestampInFuture), 10000)
    const datasourceJob1 = await Scheduling.upsertJob(datasourceConfig1)
    const datasourceConfig2 = generateConfig(true, new Date(timestampInFuture), 10000)

    expect(Scheduling.existsEqualJob(datasourceConfig2)).toBeTruthy()
    expect(Scheduling.existsEqualJob(datasourceConfig1)).toBeTruthy()

    expect(datasourceJob1).not.toEqual(datasourceConfig2)
  })

  test('should execute datasource once', async () => {
    const timestampInFuture = Date.now() + 200
    const datasourceConfig = generateConfig(false, new Date(timestampInFuture), 500)
    await Scheduling.upsertJob(datasourceConfig)
    expect(Scheduling.getJob(datasourceConfig.id)).not.toBeUndefined()
    await sleep(250)

    expect(Scheduling.getJob(datasourceConfig.id)).toBeUndefined() // executed once and not rescheduled
  })

  afterEach(() => {
    Scheduling.cancelAllJobs()
  })

  test('should execute datasource periodic', async () => {
    const timestampInFuture = Date.now() + 200
    const datasourceConfig = generateConfig(true, new Date(timestampInFuture), 500)
    const datasourceJob1 = await Scheduling.upsertJob(datasourceConfig)
    const nextInvocation1: Date = datasourceJob1.scheduleJob.nextInvocation()
    await sleep(250)
    const datasourceJob2 = Scheduling.getJob(datasourceConfig.id)
    const nextInvocation2: Date = datasourceJob1.scheduleJob.nextInvocation()

    expect(nextInvocation1).not.toEqual(nextInvocation2)
    expect(datasourceJob2).toBeDefined()
    if (datasourceJob2 !== undefined) {
      expect(datasourceJob1.datasourceConfig).toEqual(datasourceJob2.datasourceConfig)
    }
  })

  afterEach(() => {
    Scheduling.cancelAllJobs()
  })
})

function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateConfig (periodic: boolean, firstExecution: Date, interval: number): DatasourceConfig {
  return {
    id: 123,
    format: {
      type: 'XML',
      parameters: {}
    },
    protocol: {
      type: 'HTTP',
      parameters: {
        location: 'somewhere'
      }
    },
    metadata: {
      displayName: 'datasource 123',
      creationTimestamp: firstExecution,
      license: 'license 123'
    },
    trigger: {
      periodic: periodic,
      firstExecution: firstExecution,
      interval: interval
    }
  }
}
