import * as express from 'express'
import axios from 'axios'


import PipelineExecutor from '../../pipeline-execution/pipelineExecutor'
import PipelineExecutionRequest from '../pipelineExecutionRequest'
import JobResult from '../../pipeline-execution/jobResult'

export class PipelineExecutionEndpoint {
  transformationService: PipelineExecutor

  constructor (transformationService: PipelineExecutor, app: express.Application) {
    this.transformationService = transformationService

    app.post('/job', this.postJob)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  postJob = async (req: express.Request, res: express.Response): Promise<void> => {
    const transformation: PipelineExecutionRequest = req.body
    if (!transformation.data && !transformation.dataLocation) {
      res.writeHead(400)
      res.end()
      return
    } else if (transformation.dataLocation) {
      if (transformation.data) {
        console.log(`Data and dataLocation fields both present.
         Overwriting existing data with data from ${transformation.dataLocation}`)
      }
      console.log(`Fetching data from adapter, location: ${transformation.dataLocation}`)
      const importResponse = await axios.get(transformation.dataLocation)
      console.log('Fetching successful.')
      transformation.data = importResponse.data
    }
    if (!transformation.func) {
      transformation.func = 'return data;' // Undefined transformation functions are interpreted as identity function
    }
    const result: JobResult = this.transformationService.executeJob(transformation.func, transformation.data)
    const answer: string = JSON.stringify(result)
    res.setHeader('Content-Type', 'application/json')
    if (result.data) {
      res.writeHead(200)
    } else {
      res.writeHead(400)
    }
    res.write(answer)
    res.end()
  }
}
