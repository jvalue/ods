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
    try {
      // global map erase pipeline key
      const data = await this.pipelineExecutor.execute(dataImportRequest)
      res.status(200).send(data)
      // erase value
    } catch (e) {
      res.status(500).send('Failure in data import')
    }
  }
}
