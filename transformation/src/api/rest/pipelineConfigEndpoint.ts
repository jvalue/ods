import * as express from 'express'
import axios from 'axios'

import PipelineConfigTriggerRequest from './pipelineConfigTriggerRequest'
import { PipelineConfigManager } from '@/pipeline-config/pipelineConfigManager'


export class PipelineConfigEndpoint {
  pipelineConfigManager: PipelineConfigManager

  constructor (pipelineConfigManager: PipelineConfigManager, app: express.Application) {
    this.pipelineConfigManager = pipelineConfigManager

    app.post('/config/:id/trigger', this.triggerConfigExecution)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  triggerConfigExecution = async (req: express.Request, res: express.Response): Promise<void> => {
    const triggerRequest: PipelineConfigTriggerRequest = req.body
    if (!triggerRequest.data && !triggerRequest.dataLocation || !triggerRequest.pipelineId) {
      res.writeHead(400)
      res.end()
      return
    } else if (triggerRequest.dataLocation) {
      if (triggerRequest.data) {
        console.log(`Data and dataLocation fields both present.
         Overwriting existing data with data from ${triggerRequest.dataLocation}`)
      }
      console.log(`Fetching data from adapter, location: ${triggerRequest.dataLocation}`)
      const importResponse = await axios.get(triggerRequest.dataLocation)
      console.log('Fetching successful.')
      triggerRequest.data = importResponse.data
    }
    if (!triggerRequest.func) {
      triggerRequest.func = 'return data;' // Undefined transformation functions are interpreted as identity function
    }

    // TODO: trigger

    const answer = `Triggered pipeline ${triggerRequest.pipelineId}. Executing asynchronously...`
    res.setHeader('Content-Type', 'text/plain')
    res.writeHead(204)
    res.write(answer)
    res.end()
  }
}
