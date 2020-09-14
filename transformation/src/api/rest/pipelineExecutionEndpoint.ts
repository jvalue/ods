import * as express from 'express'

import PipelineExecutor from '../../pipeline-execution/pipelineExecutor'
import { PipelineExecutionRequestValidator } from '../pipelineExecutionRequest'
import JobResult from '../../pipeline-execution/jobResult'

export class PipelineExecutionEndpoint {
  pipelineExecutor: PipelineExecutor

  constructor (pipelineExecutor: PipelineExecutor, app: express.Application) {
    this.pipelineExecutor = pipelineExecutor

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
    if (result.data) {
      res.status(200).json(result)
    } else {
      res.status(400).json(result)
    }
  }
}
