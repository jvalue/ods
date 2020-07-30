/* eslint-env jest */
import * as PipelineExecution from './workflow-execution'
import * as AdapterClient from './clients/adapter-client'
import * as TransformationClient from './clients/transformation-client'
import * as AmqpClient from './clients/amqp-client'
import * as CoreClient from './clients/core-client'
import PipelineConfig from './interfaces/pipeline-config'
import AdapterResponse from '@/interfaces/adapter-response'
import DatasourceConfig from './interfaces/datasource-config'
import TransformationConfig from './interfaces/transformation-config'

jest.mock('./clients/adapter-client')
jest.mock('./clients/transformation-client')
jest.mock('./clients/core-client')
jest.mock('./clients/amqp-client')


const mockGetPipelinesForDatasource = CoreClient.getCachedPipelinesByDatasourceId as jest.Mock
const mockExecuteAdapter = AdapterClient.executeAdapter as jest.Mock
const mockExecuteTransformation = TransformationClient.executeTransformation as jest.Mock
const mockPublishExecutionSuccessAmqp = AmqpClient.publishPipelineExecutionSuccess as jest.Mock

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
  const datasourceConfig = generateDatasourceConfig(false)
  const transformation = { dataLocation: '/data/42' }
  const pipelineConfig = generatePipelineConfig(transformation)

  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.execute(datasourceConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(datasourceConfig)

  expect(mockGetPipelinesForDatasource).toHaveBeenCalledWith(datasourceConfig.id)

  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
  expect(mockExecuteTransformation).toHaveBeenCalledTimes(1)
})

test('Should execute pipeline periodic', async () => {
  const datasourceConfig = generateDatasourceConfig(true)
  const transformation = { dataLocation: 'data/42' }
  const pipelineConfig = generatePipelineConfig(transformation)

  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import

  mockExecuteAdapter.mockResolvedValue(adapterResponse)
  mockExecuteTransformation.mockResolvedValue({ data: transformedData })

  await PipelineExecution.execute(datasourceConfig)

  expect(mockExecuteAdapter).toHaveBeenCalledWith(datasourceConfig)

  expect(mockGetPipelinesForDatasource).toHaveBeenCalledWith(datasourceConfig.id)

  expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
})

test('Should trigger notifications', async () => {
  const transformation: TransformationConfig = {
    dataLocation: 'hier'
  }
  const datasourceConfig = generateDatasourceConfig(false)
  const pipelineConfig = generatePipelineConfig(transformation)

  mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import
  mockExecuteAdapter.mockResolvedValue(adapterResponse)

  await PipelineExecution.execute(datasourceConfig)

  expect(mockPublishExecutionSuccessAmqp).toHaveBeenCalledTimes(1)
})

function generateDatasourceConfig (periodic = true): DatasourceConfig {
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

function generatePipelineConfig (transformation: TransformationConfig | undefined): PipelineConfig {
  return {
    id: 555,
    datasourceId: 123,
    transformation: transformation,
    metadata: {
      displayName: 'pipeline 555',
      creationTimestamp: new Date(Date.now() + 5000),
      license: 'license 555'
    }
  }
}
