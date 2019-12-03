/* eslint-env jest */
import * as PipelineExecution from './pipeline-execution'
import * as AdapterClient from './clients/adapter-client'
import * as StorageClient from './clients/storage-client'
import * as TransformationClient from './clients/transformation-client'
import * as PipelineScheduling from './pipeline-scheduling'
import PipelineConfig from './interfaces/pipeline-config'
import NotificationConfig from './interfaces/notification-config'

jest.mock('./clients/adapter-client')
jest.mock('./clients/storage-client')
jest.mock('./clients/transformation-client')
jest.mock('./pipeline-scheduling')

const mockExecuteAdapter = AdapterClient.executeAdapter as jest.Mock
const mockExecuteTransformation = TransformationClient.executeTransformation as jest.Mock
const mockExecuteStorage = StorageClient.executeStorage as jest.Mock
const mockExecuteNotification = TransformationClient.executeNotification as jest.Mock

const mockSchedulePipeline = PipelineScheduling.schedulePipeline as jest.Mock
const mockRemovePipelineJob = PipelineScheduling.removePipelineJob as jest.Mock

const importedData = {
  value1: 1,
  value2: 'zwo'
}
const transformedData = {
  value2: 'zwo'
}

afterEach(() => {
  jest.clearAllMocks()
})

test('Should execute pipeline once', async () => {
  const transformation = generateTransformation('return { value2: data.value2 }', importedData)
  const pipelineConfig = generateConfig([transformation], false, [])

  mockExecuteAdapter.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(pipelineConfig.adapter)
  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
  expect(mockExecuteTransformation).toHaveBeenCalledTimes(1)
  expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)

  expect(mockRemovePipelineJob).toHaveBeenCalled()
  expect(mockSchedulePipeline).not.toHaveBeenCalled()
})

test('Should execute pipeline periodic', async () => {
  const transformation = generateTransformation('return data + 1', importedData)
  const pipelineConfig = generateConfig([transformation], true, [])

  mockExecuteAdapter.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(pipelineConfig.adapter)
  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
  expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)

  expect(mockRemovePipelineJob).not.toHaveBeenCalled()
  expect(mockSchedulePipeline).toHaveBeenCalled()
})

test('Should execute multiple transformations', async () => {
  const transformation1 = generateTransformation('return data + 1', importedData)
  const transformation2 = generateTransformation('return data + 2', transformedData)
  const transformation3 = generateTransformation('return data + 3', transformedData)

  const pipelineConfig = generateConfig([transformation1, transformation2, transformation3], false, [])

  mockExecuteAdapter.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteTransformation).toHaveBeenCalledTimes(3)
  expect(mockExecuteTransformation).toHaveBeenNthCalledWith(1, transformation1)
  expect(mockExecuteTransformation).toHaveBeenNthCalledWith(2, transformation2)
  expect(mockExecuteTransformation).toHaveBeenNthCalledWith(3, transformation3)
})

test('Should ignore empty transformation arrays', async () => {
  const pipelineConfig = generateConfig([], false, [])

  mockExecuteAdapter.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteTransformation).not.toHaveBeenCalled()
})

test('Should trigger notifications', async () => {
  const notification1: NotificationConfig = {
    data: { value1: 1 },
    dataLocation: 'some.where/over/the/rainbow'
  }
  const notification2: NotificationConfig = {
    data: { schtring: 'text' },
    dataLocation: 'way.up/high'
  }
  const pipelineConfig = generateConfig([], false, [notification1, notification2])

  mockExecuteAdapter.mockResolvedValue(importedData)

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteNotification).toHaveBeenCalledTimes(2)
})

function generateTransformation (func: string, data: object): object {
  return {
    func,
    data
  }
}

function generateConfig (
  transformations: object[], periodic = true, notifications: NotificationConfig[]): PipelineConfig {
  return {
    id: 123,
    adapter: {
      format: {
        type: 'XML',
        parameters: {}
      },
      protocol: {
        type: 'HTTP',
        parameters: {
          location: 'somewhere'
        }
      }
    },
    transformations,
    persistence: {},
    metadata: {
      displayName: 'pipiline',
      creationTimestamp: new Date(Date.now() + 5000),
      license: 'license'
    },
    trigger: {
      periodic: periodic,
      firstExecution: new Date(Date.now() + 5000),
      interval: 5000
    },
    notifications
  }
}
