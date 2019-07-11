/* eslint-env jest */

import * as PipelineScheduling from './pipeline-scheduling'
import { executeAdapter } from './adapter-client'
import { executeTransformation } from './transformation-client'
import { executeStorage } from './storage-client'

jest.mock('./adapter-client')
const mockedExecuteAdapter = executeAdapter as jest.Mock
mockedExecuteAdapter.mockResolvedValue({})

jest.mock('./transformation-client')
const mockedExecuteTransformation = executeTransformation as jest.Mock
mockedExecuteTransformation.mockResolvedValue({})

jest.mock('./storage-client')
const mockedExecuteStorage = executeStorage as jest.Mock
mockedExecuteStorage.mockResolvedValue({})

describe('Scheduler', () => {
  test('should have correct execution date in the future', () => {
    const timestampInFuture = Date.now() + 6000
    const pipelineConfig = generateConfig(true, new Date(timestampInFuture), 6000)
    
    expect(PipelineScheduling.determineExecutionDate(pipelineConfig).getTime()).toEqual(timestampInFuture)
  })

  test('should have correct execution date in the past', () => {
    const timestampInPast = Date.now() - 5000
    const interval = 10000

    const pipelineConfig = generateConfig(true, new Date(timestampInPast), interval)
    
    const expectedExecution = new Date(timestampInPast + interval)
    expect(PipelineScheduling.determineExecutionDate(pipelineConfig)).toEqual(expectedExecution)
  })

  test('should insert new pipeline', () => {
    const timestampInFuture = Date.now() + 5000
    const pipelineConfig = generateConfig(true, new Date(timestampInFuture), 10000)
    
    const pipelineJob = PipelineScheduling.upsertPipelineJob(pipelineConfig)

    expect(pipelineJob.pipelineConfig).toEqual(pipelineConfig)
    expect(pipelineJob.scheduleJob).toBeDefined()
    expect(PipelineScheduling.getPipielineJob(pipelineConfig.id)).toEqual(pipelineJob)
  })

  test('should update existing pipeline', () => {
    const timestampInFuture1 = Date.now() + 5000
    const timestampInFuture2 = Date.now() + 100000
    const pipelineConfig1 = generateConfig(true, new Date(timestampInFuture1), 10000)

    const pipelineJob1 = PipelineScheduling.upsertPipelineJob(pipelineConfig1)
    expect(PipelineScheduling.existsPipelineJob(pipelineConfig1.id)).toBeTruthy()

    const pipelineConfig2 = generateConfig(true, new Date(timestampInFuture2), 10000)
    PipelineScheduling.upsertPipelineJob(pipelineConfig2)

    expect(PipelineScheduling.existsPipelineJob(pipelineConfig1.id)).toBeTruthy()
    expect(PipelineScheduling.existsEqualPipelineJob(pipelineConfig2)).toBeTruthy()
    expect(PipelineScheduling.existsEqualPipelineJob(pipelineConfig1)).toBeFalsy()

    expect(pipelineJob1).not.toEqual(pipelineConfig2)
  })

  test('should be equal', () => {
    const timestampInFuture = Date.now() + 5000
    const pipelineConfig1 = generateConfig(true, new Date(timestampInFuture), 10000)
    const pipelineJob1 = PipelineScheduling.upsertPipelineJob(pipelineConfig1)
    const pipelineConfig2 = generateConfig(true, new Date(timestampInFuture), 10000)

    expect(PipelineScheduling.existsEqualPipelineJob(pipelineConfig2)).toBeTruthy()
    expect(PipelineScheduling.existsEqualPipelineJob(pipelineConfig1)).toBeTruthy()

    expect(pipelineJob1).not.toEqual(pipelineConfig2)
  })

  test('should execute pipeline once', async () => {
    const timestampInFuture = Date.now() + 200
    const pipelineConfig = generateConfig(false, new Date(timestampInFuture), 500)
    
    PipelineScheduling.upsertPipelineJob(pipelineConfig)
    await sleep(250)

    expect(PipelineScheduling.getPipielineJob(pipelineConfig.id)).toBeUndefined()
  })

  afterEach(() => {
    PipelineScheduling.cancelAllJobs()
  })

  test('should execute pipeline periodic', async () => {
    const timestampInFuture = Date.now() + 200
    const pipelineConfig = generateConfig(true, new Date(timestampInFuture), 500)
    
    const pipelineJob1 = PipelineScheduling.upsertPipelineJob(pipelineConfig)
    const nextInvocation1: Date = pipelineJob1.scheduleJob.nextInvocation()
    await sleep(250)
    const pipelineJob2 = PipelineScheduling.getPipielineJob(pipelineConfig.id)
    const nextInvocation2: Date = pipelineJob1.scheduleJob.nextInvocation()

    expect(nextInvocation1).not.toEqual(nextInvocation2)
    expect(pipelineJob1.pipelineConfig).toEqual(pipelineJob2!.pipelineConfig)
  })

  afterEach(() => {
    PipelineScheduling.cancelAllJobs()
  })
})

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const generateConfig = (periodic: boolean, firstExecution: Date, interval: number) => {
  return {
    id: 123,
    adapter: {},
    transformations: [{}],
    persistence: {},
    metadata: {},

    trigger: {
      periodic,
      firstExecution,
      interval
    }
  }
}
