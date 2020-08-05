import * as express from 'express'
import axios from 'axios'

import PipelineConfigTriggerRequest from '../pipelineConfigTriggerRequest'
import { PipelineConfigManager } from '../../pipeline-config/pipelineConfigManager'
import PipelineConfig from '@/pipeline-config/model/pipelineConfig'


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
    const triggerRequest: PipelineConfigTriggerRequest = req.body
    if (!triggerRequest.data && !triggerRequest.dataLocation || !triggerRequest.datasourceId) {
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

    this.pipelineConfigManager.triggerConfig(triggerRequest.datasourceId, triggerRequest.data)

    const answer = `Triggered all pipelines for datasource ${triggerRequest.datasourceId}. Executing asynchronously...`
    res.setHeader('Content-Type', 'text/plain')
    res.writeHead(200)
    res.write(JSON.stringify(answer))
    res.end()
  }

  delete = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = req.params.id
    if(!configId) {
      res.writeHead(400)
      res.write("Path parameter id is missing or is incorrect")
      res.end()
      return
    }
    const config = await this.pipelineConfigManager.delete(+configId)
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(204)
    res.end()
  }


  deleteAll = async (req: express.Request, res: express.Response): Promise<void> => {
    const config = await this.pipelineConfigManager.deleteAll()
    res.writeHead(204)
    res.end()
  }

  update = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = req.params.id
    if(!configId) {
      res.writeHead(400)
      res.write("Path parameter id is missing or is incorrect")
      res.end()
      return
    }
    const config = req.body as PipelineConfig
    if(!config.transformation) {
      config.transformation = { func: "return data;"}
    }
    try {
      await this.pipelineConfigManager.update(+configId, config)
    } catch (e) {
      res.status(404).send(`Could not find config with id ${configId}: ${e}`)
    }
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(204)
    res.end()
  }

  create = async (req: express.Request, res: express.Response): Promise<void> => {
    const config = req.body as PipelineConfig
    if(!config.transformation) {
      config.transformation = { func: "return data;"}
    }
    const savedConfig = await this.pipelineConfigManager.create(config)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader("location", `/configs/${savedConfig.id}`)
    res.writeHead(201)
    res.write(JSON.stringify(savedConfig))
    res.end()
  }

  getByDatasourceId = async (datasourceId: number, req: express.Request, res: express.Response): Promise<void> => {
    const configs = await this.pipelineConfigManager.getByDatasourceId(datasourceId)
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.write(JSON.stringify(configs))
    res.end()
  }

  getOne = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = req.params.id
    if(!configId) {
      res.writeHead(400)
      res.write("Path parameter id is missing or is incorrect")
      res.end()
      return
    }
    const config = await this.pipelineConfigManager.get(+configId)
    if(!config) {
      res.status(404).send(`Config not found`)
    }
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.write(JSON.stringify(config))
    res.end()
  }

  getAll = async (req: express.Request, res: express.Response): Promise<void> => {
    const datasourceId = req.query.datasourceId
    if(datasourceId) {
      return this.getByDatasourceId(+datasourceId, req, res)
    }

    const configs = await this.pipelineConfigManager.getAll()
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(200)
    res.write(JSON.stringify(configs))
    res.end()
  }
}
