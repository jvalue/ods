/* eslint-env jest */
import * as DatasourceClient from '../clients/datasource-client'
import * as PipelineClient from '../clients/pipeline-client'
import { PipelineExecutor } from './pipeline-executor'
import { DataImportRequest } from '../api/dataImportRequest'

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

  it('should execyte dataImportRequests correctly', async () => {
    getPipeline.mockReturnValue(
      { datasourceId: 2 }
    )
    triggerDatasource.mockReturnValue(Promise.resolve())

    const dataImportRequest: DataImportRequest = {
      pipelineId: 1
    }

    await pipelineExecutor.execute(dataImportRequest)

    expect(getPipeline.mock.calls[0][0]).toEqual(1)
    expect(triggerDatasource.mock.calls[0][0]).toEqual(2)
  })
})
