/* eslint-env jest */
import * as PipelineExecution from './workflow-execution'
import * as AdapterClient from './clients/adapter-client'
import AdapterResponse from '@/interfaces/adapter-response'
import DatasourceConfig from './interfaces/datasource-config'

jest.mock('./clients/adapter-client')


const mockExecuteAdapter = AdapterClient.executeAdapter as jest.Mock


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

// test('Should execute pipeline once', async () => {
//   const datasourceConfig = generateDatasourceConfig(false)

//   mockExecuteAdapter.mockResolvedValue(adapterResponse)


//   await PipelineExecution.execute(datasourceConfig)

//   expect(mockExecuteAdapter).toHaveBeenCalledWith(datasourceConfig)

//   //expect(mockGetPipelinesForDatasource).toHaveBeenCalledWith(datasourceConfig.id)
//   // expect(mockGetPipelineConfigs).toHaveBeenCalledWith(datasourceConfig.id)

//   // expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
//   // expect(mockExecuteTransformation).toHaveBeenCalledTimes(1)

//   // expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)
// })

// test('Should execute pipeline periodic', async () => {
//   const datasourceConfig = generateDatasourceConfig(true)
//   const transformation = { dataLocation: 'data/42' }
 
//   mockExecuteAdapter.mockResolvedValue(adapterResponse)

//   await PipelineExecution.execute(datasourceConfig)

//   expect(mockExecuteAdapter).toHaveBeenCalledWith(datasourceConfig)

//   // expect(mockGetPipelinesForDatasource).toHaveBeenCalledWith(datasourceConfig.id)

//   // expect(mockExecuteTransformation).toHaveBeenCalledWith(transformation)
//   // expect(mockExecuteStorage).toHaveBeenCalledWith(pipelineConfig, transformedData)
// })

test('Should not execute undefined transformation', async () => {
  // const datasourceConfig = generateDatasourceConfig(false)
  

  // mockExecuteAdapter.mockResolvedValue(adapterResponse)

  // await PipelineExecution.execute(datasourceConfig)

  // expect(mockExecuteNotification).not.toBeCalled()
})

// test('Should trigger notifications', async () => {
//   const notification1: NotificationConfig = {
//     type: 'WEBHOOK',
//     data: { value1: 1 },
//     dataLocation: 'some.where/over/the/rainbow'
//   }
//   const notification2: NotificationConfig = {
//     type: 'SLACK',
//     data: { schtring: 'text' },
//     dataLocation: 'way.up/high'
//   }
//   const notification3: NotificationConfig = {
//     type: 'FCM',
//     data: { schtring: 'text' },
//     dataLocation: 'way.up/high'
//   }
//   const transformation: TransformationConfig = {
//     dataLocation: 'hier'
//   }
//   const datasourceConfig = generateDatasourceConfig(false)
//   const pipelineConfig = generatePipelineConfig(transformation, [notification1, notification2, notification3])

//   mockGetPipelinesForDatasource.mockReturnValue([pipelineConfig]) // register pipeline to follow datasource import
//   mockGetPipelineConfigs.mockReturnValue([pipelineConfig])
  
//   mockExecuteAdapter.mockResolvedValue(adapterResponse)

//   await PipelineExecution.execute(datasourceConfig)

//   expect(mockExecuteNotification).toHaveBeenCalledTimes(3)
// })

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