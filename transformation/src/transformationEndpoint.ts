import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import TransformationService from './interfaces/transformationService'
import TransformationRequest from './interfaces/transformationRequest'
import { Server } from 'http'
import JobResult from './interfaces/jobResult'
import axios from 'axios'
import { StorageHandler } from './storageHandler';
import { TransformationConfig } from './interfaces/TransormationConfig';
import { AmqpHandler } from './amqpHandler';
import { TransformationEvent } from './interfaces/transformationEvent';

export class TransformationEndpoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  transformationService: TransformationService
  

  constructor (transformationService: TransformationService, port: number, auth: boolean) {
    this.port = port
    this.transformationService = transformationService
    

    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.json({ limit: '50mb' }))
    this.app.use(bodyParser.urlencoded({ extended: false }))

    this.store = undefined
    if (auth) {
      this.store = new session.MemoryStore()
      this.keycloak = new Keycloak({ store: this.store })
      this.app.use(this.keycloak.middleware())
    }

    this.app.get('/', this.getHealthCheck)
    this.app.get('/version', this.getVersion)
    this.app.post('/job', this.determineAuth(), this.postJob)

    this.app.post('/config', this.determineAuth(), this.handleConfigRequest)
    this.app.get('/config/:id', this.getConfigs)

    StorageHandler.initConnection(10, 5)
    AmqpHandler.connect(10, 5)
  }

  listen (): Server {
    return this.app.listen(this.port, () => {
      console.log('listening on port ' + this.port)
    })
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  getHealthCheck = (req: Request, res: Response): void => {
    res.send('I am alive!')
  }

  getVersion = (req: Request, res: Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(this.transformationService.getVersion())
    res.end()
  }

  /**===========================================================================
    * Handles a request to save a TransformationConfig
    * This is done by checking the validity of the config and then save
    * it to the database on success
    *============================================================================*/
  handleConfigRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Transformation config from Host ${req.connection.remoteAddress}`)

    var transformationConfig = req.body as TransformationConfig

    // Check for validity of the request
    if (!(this.isValidTransformationConfig(transformationConfig))) {
      console.warn('Malformed transformation request.')
      res.status(400).send('Malformed transformation request.')
    }

    // Persist Config
    try {
      StorageHandler.saveTransformationConfig(transformationConfig)
    } catch (error) {
      console.error(`Could not create transformationConfig Object: ${error}`)
      res.status(400).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(200).send('OK');
  }

  /**===============================================================================
     * Gets all Configs asto corresponding to corresponnding Pipeline-ID
     * (identified by param id) as json list
     *================================================================================*/
  getConfigs = (req: Request, res: Response): void => {

    const pipelineID = parseInt(req.params.id)
    console.log(`Received request for configs with pipeline id ${pipelineID} from Host ${req.connection.remoteAddress}`)

    if (!pipelineID) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Get configs from database
    let configs = StorageHandler.getTransformationConfigs(pipelineID)

    if (!configs) {
      res.status(500).send('Internal Server Error')
      return
    }

    // Get configSummary from promise
    configs.then(configSummary => {
      if (!configSummary) {
        res.status(500).send('Internal Server Error')
        return
      }

      res.status(200).send(configSummary)
    })
  }


  postJob = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received request: ${req.body}`)

    // TODO: Implement PipelineID + PipeLine name in Request
    let pipelineID = req.body.pipelineID

    const transformation: TransformationRequest = req.body
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
    
    let transformationEvent = new TransformationEvent(pipelineID, 'PIPELINE_TEST', result, transformation.dataLocation)
    AmqpHandler.notifyNotificationService(transformationEvent)

    res.end()
  }

  determineAuth = (): express.RequestHandler | [] => {
    if (this.keycloak !== undefined) {
      return this.keycloak.protect()
    } else {
      return []
    }
  }

  private isValidTransformationConfig(conf: TransformationConfig): boolean {
    return !!conf && !!conf.dataLocation && !!conf.func && !!conf.pipelineId
  }
}
