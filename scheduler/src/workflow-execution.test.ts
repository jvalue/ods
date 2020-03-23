/* eslint-env jest */
import * as PipelineExecution from './workflow-execution'
import * as AdapterClient from './clients/adapter-client'
import * as StorageClient from './clients/storage-client'
import * as TransformationClient from './clients/transformation-client'
import * as CoreClient from './clients/core-client'
import PipelineConfig from './interfaces/pipeline-config'
import NotificationConfig from './interfaces/notification-config'
import AdapterResponse from '@/interfaces/adapter-response'
import DatasourceConfig from './interfaces/datasource-config'

jest.mock('./clients/adapter-client')
jest.mock('./clients/storage-client')
jest.mock('./clients/transformation-client')
jest.mock('./clients/core-client')

const mockGetPipelinesForDatasource = CoreClient.getCachedPipelinesByDatasourceId as jest.Mock
const mockExecuteAdapter = AdapterClient.executeAdapter as jest.Mock
const mockFetchImportedData = AdapterClient.fetchImportedData as jest.Mock
const mockExecuteTransformation = TransformationClient.executeTransformation as jest.Mock
const mockExecuteStorage = StorageClient.executeStorage as jest.Mock
const mockExecuteNotification = TransformationClient.executeNotification as jest.Mock

const adapterResponse: AdapterResponse = {
  id: 42
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
  const datasourceConfig = generateDatasourceConfig(false)
  const transformation = generateTransformation('return { value2: data.value2 }', importedData)
  const pipelineConfig = generatePipelineConfig([transformation], [])

  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.execute(datasourceConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(datasourceConfig)
  expect(mockFetchImportedData).toHaveBeenCalledWith(adapterResponse.id)

  expect(mockGetPipelinesForDatasource).toHaveBeenCalledWith(datasourceConfig.id)

  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
  expect(mockExecuteTransformation).toHaveBeenCalledTimes(1)

  expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)
})

test('Should execute pipeline periodic', async () => {
  const datasourceConfig = generateDatasourceConfig(true)
  const transformation = generateTransformation('return data + 1', importedData)
  const pipelineConfig = generatePipelineConfig([transformation], [])

  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.execute(datasourceConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(datasourceConfig)
  expect(mockFetchImportedData).toHaveBeenCalledWith(adapterResponse.id)

  expect(mockGetPipelinesForDatasource).toHaveBeenCalledWith(datasourceConfig.id)

  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)

  expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)
})

test('Should execute multiple transformations', async () => {
  const transformation1 = generateTransformation('return data + 1', importedData)
  const transformation2 = generateTransformation('return data + 2', transformedData)
  const transformation3 = generateTransformation('return data + 3', transformedData)

  const datasourceConfig = generateDatasourceConfig(false)
  const pipelineConfig = generatePipelineConfig([transformation1, transformation2, transformation3], [])
  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.execute(datasourceConfig)

  expect(mockExecuteTransformation).toHaveBeenCalledTimes(3)
  expect(mockExecuteTransformation).toHaveBeenNthCalledWith(1, transformation1)
  expect(mockExecuteTransformation).toHaveBeenNthCalledWith(2, transformation2)
  expect(mockExecuteTransformation).toHaveBeenNthCalledWith(3, transformation3)
})

test('Should ignore empty transformation arrays', async () => {
  const datasourceConfig = generateDatasourceConfig(false)
  const pipelineConfig = generatePipelineConfig([], [])
  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.execute(datasourceConfig)
  expect(mockExecuteTransformation).not.toHaveBeenCalled()
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
  const datasourceConfig = generateDatasourceConfig(false)
  const pipelineConfig = generatePipelineConfig([], [notification1, notification2, notification3])
  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockFetchImportedData.mockResolvedValue(importedData)

  await PipelineExecution.execute(datasourceConfig)

  expect(mockExecuteNotification).toHaveBeenCalledTimes(3)
})

function generateTransformation (func: string, data: object): object {
  return {
    func,
    data
  }
}

function generateDatasourceConfig(periodic = true): DatasourceConfig {
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
    trigger: {
      periodic: periodic,
      firstExecution: new Date(Date.now() + 5000),
      interval: 5000
    },
    metadata: {
      displayName: 'datasource 123',
      creationTimestamp: new Date(Date.now() + 5000),
      license: 'license 123'
    },
  }
}

function generatePipelineConfig (
  transformations: object[], notifications: NotificationConfig[]): PipelineConfig {
  return {
    id: 555,
    datasourceId: 123,
    transformations,
    persistence: {},
    metadata: {
      displayName: 'pipeline 555',
      creationTimestamp: new Date(Date.now() + 5000),
      license: 'license 555'
    },
    notifications
  }
}
