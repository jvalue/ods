import express from 'express';

import { JobResult } from '../../pipeline-execution/jobResult';
import PipelineExecutor from '../../pipeline-execution/pipelineExecutor';
import { PipelineExecutionRequestValidator } from '../pipelineExecutionRequest';

import { asyncHandler } from './utils';

export class PipelineExecutionEndpoint {
  constructor(private readonly pipelineExecutor: PipelineExecutor) {}

  registerRoutes = (app: express.Application): void => {
    app.post('/job', asyncHandler(this.postJob));
  };

  // The following methods need arrow syntax because of javascript 'this' shenanigans
  postJob = (req: express.Request, res: express.Response): void => {
    const validator = new PipelineExecutionRequestValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }

    const result: JobResult = this.pipelineExecutor.executeJob(req.body.func, req.body.data);
    if ('error' in result) {
      res.status(400).json(result);
      return;
    }
    res.status(200).json(result);
  };
}
