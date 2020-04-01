/* eslint-env jest */
import * as PipelineExecution from './pipeline-execution'
import * as AdapterClient from './clients/adapter-client'
import * as StorageClient from './clients/storage-client'
import * as TransformationClient from './clients/transformation-client'
import * as PipelineScheduling from './pipeline-scheduling'
import PipelineConfig from './interfaces/pipeline-config'
import NotificationConfig from './interfaces/notification-config'
import AdapterResponse from './interfaces/adapter-response'
import TransformationConfig from './interfaces/transformation-config'

jest.mock('./clients/adapter-client')
jest.mock('./clients/storage-client')
jest.mock('./clients/transformation-client')
jest.mock('./pipeline-scheduling')

const mockExecuteAdapter = AdapterClient.executeAdapter as jest.Mock
const mockFetchImportedData = AdapterClient.fetchImportedData as jest.Mock
const mockExecuteTransformation = TransformationClient.executeTransformation as jest.Mock
const mockExecuteStorage = StorageClient.executeStorage as jest.Mock
const mockExecuteNotification = TransformationClient.executeNotification as jest.Mock

const mockSchedulePipeline = PipelineScheduling.schedulePipeline as jest.Mock
const mockRemovePipelineJob = PipelineScheduling.removePipelineJob as jest.Mock

const adapterResponse: AdapterResponse = {
  id: 42,
  location: '/data/42'
}

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
  const transformation = { dataLocation: '/data/42' }
  const pipelineConfig = generateConfig(transformation, false, [])

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(pipelineConfig.adapter)
  expect(mockFetchImportedData).not.toBeCalled()
  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation, adapterResponse.location)
  expect(mockExecuteTransformation).toHaveBeenCalledTimes(1)
  expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)

  expect(mockRemovePipelineJob).toHaveBeenCalled()
  expect(mockSchedulePipeline).not.toHaveBeenCalled()
})

test('Should execute pipeline periodic', async () => {
  const transformation = { dataLocation: 'data/42' }
  const pipelineConfig = generateConfig(transformation, true, [])

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(pipelineConfig.adapter)
  expect(mockFetchImportedData).not.toBeCalled()
  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation, adapterResponse.location)
  expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)

  expect(mockRemovePipelineJob).not.toHaveBeenCalled()
  expect(mockSchedulePipeline).toHaveBeenCalled()
})

test('Should not execute undefined transformation', async () => {
  const pipelineConfig = generateConfig(undefined, true, [])

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockFetchImportedData).toHaveBeenCalledWith(adapterResponse.id)
  expect(mockExecuteNotification).not.toBeCalled()
})

test('Should trigger notifications', async () => {
  const notification1: NotificationConfig = {
    type: 'WEBHOOK',
    data: { value1: 1 },
    dataLocation: 'some.where/over/the/rainbow'
  }
  const notification2: NotificationConfig = {
    type: 'SLACK',
    data: { schtring: 'text' },
    dataLocation: 'way.up/high'
  }
  const notification3: NotificationConfig = {
    type: 'FCM',
    data: { schtring: 'text' },
    dataLocation: 'way.up/high'
  }
  const pipelineConfig = generateConfig(undefined, false, [notification1, notification2, notification3])

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)

  await PipelineExecution.executePipeline(pipelineConfig)

  expect(mockExecuteNotification).toHaveBeenCalledTimes(3)
})

function generateConfig (
  transformation: TransformationConfig | undefined, periodic = true, notifications: NotificationConfig[]): PipelineConfig {
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
    transformation: transformation,
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
