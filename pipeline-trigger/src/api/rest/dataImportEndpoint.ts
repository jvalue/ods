import express from 'express'
import { PipelineExecutor } from '../../pipeline-executor/pipeline-executor'

export class DataImportEndpoint {
  constructor (private readonly pipelineExecutor: PipelineExecutor) {}

  registerRoutes = (app: express.Application): void => {
    app.post('/dataImport', this.handleDataImport)
  }

  handleDataImport = async (req: express.Request, res: express.Response): Promise<void> => {
    const dataImportRequest = req.body

    // validate

    // check if pipeline exists?

    await this.pipelineExecutor.execute(dataImportRequest)
      .catch((e) => {
        res.status(500).send('Failure in pipelineExecution')
      })
    res.status(204).send()
  }
}
