import * as express from 'express'
import axios from 'axios'

import { PipelineConfigTriggerRequestValidator } from '../pipelineConfigTriggerRequest'
import { PipelineConfigManager } from '@/pipeline-config/pipelineConfigManager'
import { PipelineConfigDTOValidator } from '../../pipeline-config/model/pipelineConfig'
import { isString } from '../../validators'

export class PipelineConfigEndpoint {
  pipelineConfigManager: PipelineConfigManager

  constructor (pipelineConfigManager: PipelineConfigManager, app: express.Application) {
    this.pipelineConfigManager = pipelineConfigManager

    app.post('/trigger', this.triggerConfigExecution)
    app.get('/configs', this.getAll)
    app.get('/configs/:id', this.getOne)
    app.post('/configs', this.create)
    app.put('/configs/:id', this.update)
    app.delete('/configs/:id', this.delete)
    app.delete('/configs', this.deleteAll)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  triggerConfigExecution = async (req: express.Request, res: express.Response): Promise<void> => {
    const validator = new PipelineConfigTriggerRequestValidator()
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() })
      return
    }
    const triggerRequest = req.body

    if (triggerRequest.dataLocation) {
      if (triggerRequest.data) {
        console.log(`Data and dataLocation fields both present.
         Overwriting existing data with data from ${triggerRequest.dataLocation}`)
      }
      console.log(`Fetching data from adapter, location: ${triggerRequest.dataLocation}`)
      const importResponse = await axios.get(triggerRequest.dataLocation)
      console.log('Fetching successful.')
      triggerRequest.data = importResponse.data
    }

    // trigger is asynchronous! not waiting for finished execution...
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.pipelineConfigManager.triggerConfig(triggerRequest.datasourceId, triggerRequest.data)

    const answer = `Triggered all pipelines for datasource ${triggerRequest.datasourceId}. Executing asynchronously...`
    res.setHeader('Content-Type', 'text/plain')
    res.status(200).send(answer)
  }

  delete = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    if (Number.isNaN(configId)) {
      res.status(400).send('Path parameter id is missing or is incorrect')
      return
    }
    await this.pipelineConfigManager.delete(configId)
    res.status(204).send()
  }

  deleteAll = async (req: express.Request, res: express.Response): Promise<void> => {
    await this.pipelineConfigManager.deleteAll()
    res.status(204).send()
  }

  update = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    if (Number.isNaN(configId)) {
      res.status(400).send('Path parameter id is missing or is incorrect')
      return
    }
    const validator = new PipelineConfigDTOValidator()
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() })
      return
    }
    const config = req.body
    try {
      await this.pipelineConfigManager.update(configId, config)
    } catch (e) {
      res.status(404).send(`Could not find config with id ${configId}: ${e}`)
      return
    }
    res.status(204).send()
  }

  create = async (req: express.Request, res: express.Response): Promise<void> => {
    const validator = new PipelineConfigDTOValidator()
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() })
      return
    }
    const config = req.body
    const savedConfig = await this.pipelineConfigManager.create(config)
    res.status(201).location(`/configs/${savedConfig.id}`).json(savedConfig)
  }

  getOne = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    if (Number.isNaN(configId)) {
      res.status(400).send('Path parameter id is missing or is incorrect')
      return
    }
    const config = await this.pipelineConfigManager.get(configId)
    if (!config) {
      res.status(404).send('Config not found')
      return
    }
    res.status(200).json(config)
  }

  getAll = async (req: express.Request, res: express.Response): Promise<void> => {
    const datasourceId = parseInt(this.getQueryParameter(req, 'datasourceId'))
    if (Number.isNaN(datasourceId)) {
      const configs = await this.pipelineConfigManager.getAll()
      res.status(200).json(configs)
      return
    }
    const configs = await this.pipelineConfigManager.getByDatasourceId(datasourceId)
    res.status(200).json(configs)
  }

  private getQueryParameter (req: express.Request, key: string): string {
    const value = req.query[key]
    if (isString(value)) {
      return value
    }
    if (Array.isArray(value) && isString(value[0])) {
      return value[0]
    }
    return ''
  }
}
