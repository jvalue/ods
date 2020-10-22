import * as express from 'express'

import PipelineExecutor from '@ods/pipeline-execution/pipelineExecutor'
import { JobResult } from '@ods/pipeline-execution/jobResult'

import { PipelineExecutionRequestValidator } from '../pipelineExecutionRequest'

export class PipelineExecutionEndpoint {
  constructor (private readonly pipelineExecutor: PipelineExecutor) {}

  registerRoutes = (app: express.Application): void => {
    app.post('/job', this.postJob)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans
  postJob = async (req: express.Request, res: express.Response): Promise<void> => {
    const validator = new PipelineExecutionRequestValidator()
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() })
      return
    }

    const result: JobResult = this.pipelineExecutor.executeJob(req.body.func, req.body.data)
    if ('error' in result) {
      res.status(400).json(result)
      return
    }
    res.status(200).json(result)
  }
}
