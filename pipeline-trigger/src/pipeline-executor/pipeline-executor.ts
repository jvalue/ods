import { DataImportRequest } from '../api/dataImportRequest'
import * as PipelineClient from '../clients/pipeline-client'
import * as DatasourceClient from '../clients/datasource-client'
import { sleep } from '../sleep'

export class PipelineExecutor {
  private readonly _version = '0.0.1'
  private readonly triggerRequests = new Map() // pipelineId: data
  private readonly retries = 10
  private readonly backoff = 1000

  get version (): string {
    return this._version
  }

  async execute (dataImportRequest: DataImportRequest): Promise<unknown> {
    const pipelineId = dataImportRequest.pipelineId
    const pipeline = await PipelineClient.getPipeline(pipelineId)
    const datasourceId = pipeline.datasourceId

    this.triggerRequests.set(pipelineId, undefined)

    await DatasourceClient.triggerDatasource(datasourceId)
    console.log('triggered!')
    console.log(pipeline.datasourceId)
    try {
      const data = await this.waitForImportFinish(pipelineId)
      return await Promise.resolve(data)
    } catch (e) {
      console.error(`Execution of pipeline ${pipelineId} failed. Datasource id was ${datasourceId}`)
      this.triggerRequests.set(pipelineId, undefined)
      return await Promise.reject(e)
    }
  }

  private async waitForImportFinish (pipelineId: number): Promise<unknown> {
    for (let i = 0; i <= this.retries; i++) {
      const data = this.triggerRequests.get(pipelineId)
      if (data !== undefined) {
        return await Promise.resolve(data)
      }
      await sleep(this.backoff)
    }
    return await Promise.reject(new Error(`Data import was not signalled after ${this.backoff*this.retries} ms`))
  }

  signalImportSuccesful (pipelineId: number, data: unknown): void {
    this.triggerRequests.set(pipelineId, data)
  }
}
