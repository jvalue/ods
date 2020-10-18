import { DataImportRequest } from '../api/dataImportRequest'
import * as PipelineClient from '../clients/pipeline-client'
import * as DatasourceClient from '../clients/datasource-client'

export class PipelineExecutor {
  private readonly _version = '0.0.1'

  get version (): string {
    return this._version
  }

  async execute (dataImportRequest: DataImportRequest): Promise<void> {
    const pipeline = await PipelineClient.getPipeline(dataImportRequest.pipelineId)

    await DatasourceClient.triggerDatasource(pipeline.datasourceId)
    console.log('triggered!')
    console.log(pipeline.datasourceId)
  }
}
