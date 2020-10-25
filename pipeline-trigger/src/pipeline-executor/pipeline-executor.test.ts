/* eslint-env jest */
import * as DatasourceClient from '../clients/datasource-client'
import * as PipelineClient from '../clients/pipeline-client'
import { PipelineExecutor } from './pipeline-executor'
import { DataImportRequest } from '../api/dataImportRequest'
import { sleep } from '../sleep'

jest.mock('../clients/datasource-client')
jest.mock('../clients/pipeline-client')
jest.mock('../env', () => () => ({
  ADAPTER_API: '_',
  PIPELINE_API: '_'
}))

describe('PipelineExecutor', () => {
  const getPipeline = PipelineClient.getPipeline as jest.Mock
  const triggerDatasource = DatasourceClient.triggerDatasource as jest.Mock
  const pipelineExecutor = new PipelineExecutor()

  it('should execute dataImportRequests correctly', async () => {
    getPipeline.mockReturnValue(
      { datasourceId: 2 }
    )
    triggerDatasource.mockImplementation(async dsid => {
      await sleep(1000)
      pipelineExecutor.signalImportSuccesful(1, { test: 'test' })
    })

    const dataImportRequest: DataImportRequest = {
      pipelineId: 1
    }

    const data = await pipelineExecutor.execute(dataImportRequest)

    expect(getPipeline).toBeCalledWith(1)
    expect(triggerDatasource).toBeCalledWith(2)
    expect(data).toEqual({ test: 'test' })
  }, 11000)
})
