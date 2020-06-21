import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import TransformationService from './interfaces/transformationService'
import TransformationRequest from './interfaces/transformationRequest'
import { Server } from 'http'
import JobResult from './interfaces/jobResult/jobResult'
import axios from 'axios'
import { StorageHandler } from './handlers/storageHandler';
import { TransformationConfig } from './models/TransormationConfig';
import { AmqpHandler } from './handlers/amqpHandler';
import { TransformationEvent } from './interfaces/transformationEvent';
import { DeleteResult, UpdateResult } from 'typeorm';


export class TransformationEndpoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  transformationService: TransformationService
  storageHandler: StorageHandler
  amqpHandler: AmqpHandler

  constructor(transformationService: TransformationService, storageHandler: StorageHandler, amqpHandler: AmqpHandler, port: number, auth: boolean) {
    this.port = port
    this.transformationService = transformationService
    this.storageHandler = storageHandler
    this.amqpHandler = amqpHandler

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

    this.app.post('/config', this.determineAuth(), this.handleConfigCreation)
    this.app.get('/config/:id', this.handleConfigRequest)
    this.app.delete('/config/:id', this.handleConfigDeletion)
    this.app.put('/config/:id', this.handleConfigUpdate)

    this.app.delete('/pipeline/:id', this.handlePipelineDeletion) 
    
    storageHandler.init(10, 5)
    amqpHandler.connect(10, 5)
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

  /**
    * Handles a request to save a TransformationConfig
    * This is done by checking the validity of the config and then save
    * it to the database on success
    * 
    * @param req Request, containing a Transformation config to persist
    * @param res Response to send back to the requester
    */
  handleConfigCreation = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Transformation config from Host ${req.connection.remoteAddress}`)

    const transformationConfig = req.body as TransformationConfig
    let savedConfig : TransformationConfig
    // Check for validity of the request
    if (!(this.isValidTransformationConfig(transformationConfig))) {
      console.warn('Malformed transformation request.')
      res.status(400).send('Malformed transformation request.')
    }

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveTransformationConfig(transformationConfig)
    } catch (error) {
      console.error(`Could not create transformationConfig Object: ${error}`)
      res.status(500).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(200).send(savedConfig);
  }

  /**
  * Handles the deletion of a TransformationConfig
  * This is done by checking the validity of the config and then delete
  * it from the database on success
  * 
  * @param req Request, containing a Transformation config to delete
  * @param res Response to send back to the requester
  */
  handleConfigDeletion = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Transformation config from Host ${req.connection.remoteAddress}`)
    let deleteResult :DeleteResult
    const configId = parseInt(req.params.id)

    if (!configId) {
      res.status(400).send('Invalid Config Id provided.')
      res.end()
      return
    }

    // Delete Config
    try {
      deleteResult = await this.storageHandler.deleteTransformationConfig(configId)

      if (deleteResult.affected != 1) {
        const msg = `Could not delete Transformation Config: Config with id ${configId} not found.`
        console.log(msg)
        res.status(400).send(msg)
      }

    } catch (error) {
      console.error(`Could not create transformationConfig Object: ${error}`)
      res.status(500).send('Internal Server Error: Config could not deleted')
      return
    }

    // return saved post back
    res.status(200).send(`${deleteResult.affected} Configs deleted.`);
    res.end()
  }



  /**
 * Handles the deletion of all TransformationConfig with pipeline ID 1
 * This is done by checking the validity of the config and then delete
 * it from the database on success
 * 
 * @param req Request, containing a Transformation config to delete
 * @param res Response to send back to the requester
 */
  handlePipelineDeletion = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Transformation config from Host ${req.connection.remoteAddress}`)
    let deleteResult: DeleteResult
    const pipelineID = parseInt(req.params.id)

    if (!pipelineID) {
      res.status(400).send('Invalid pipeline Id provided.')
      res.end()
      return
    }

    // Delete Config
    try {
      deleteResult = await this.storageHandler.deleteConfigsForPipelineID(pipelineID)

      if (deleteResult.affected != 1) {
        const msg = `Could not delete Transformation Config: Config with id ${pipelineID} not found.`
        console.log(msg)
        res.status(400).send(msg)
      }

    } catch (error) {
      console.error(`Could not create transformationConfig Object: ${error}`)
      res.status(500).send('Internal Server Error: Config could not deleted')
      return
    }

    // return saved post back
    res.status(200).send(`${deleteResult.affected} Configs deleted.`);
    res.end()
  }

  /**
  * Handles the update of a TransformationConfig
  * This is done by checking the validity of the config and then delete
  * it from the database on success
  * 
  * @param req Request, containing a Transformation config to delete
  * @param res Response to send back to the requester
  */
  handleConfigUpdate = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Transformation config from Host ${req.connection.remoteAddress}`)

    let updateResult: UpdateResult
    const configId = parseInt(req.params.id)

    // Check for configId Validity
    if (!configId) {
      res.status(400).send('Invalid Config Id provided.')
      res.end()
      return
    }

    const transformationConfig = req.body as TransformationConfig

    // Check for validity of the request
    if (!(this.isValidTransformationConfig(transformationConfig))) {
      console.warn('Malformed transformation request.')
      res.status(400).send('Malformed transformation request.')
    }

    // Delete Config
    try {
      updateResult = await this.storageHandler.updateTransoformationConfig(configId, transformationConfig)
    } catch (error) {
      console.error(`Could not create transformationConfig Object: ${error}`)
      res.status(500).send('Internal Server Error: Config could not deleted')
      return
    }

    // return saved post back
    res.status(200).send(`${updateResult.affected} Configs were updated with ID ${configId}`);
  }

  /**
     * Gets all Configs to corresponding to corresponnding Pipeline-ID
     * (identified by param id) as json list
     * 
     * @param req Request for configs with a specific pipeline id
     * @param res Response that will contain the Config summary
     */
  handleConfigRequest = (req: Request, res: Response): void => {

    const pipelineID = parseInt(req.params.id)
    console.log(`Received request for configs with pipeline id ${pipelineID} from Host ${req.connection.remoteAddress}`)

    if (!pipelineID) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Get configs from database
    const configs = this.storageHandler.getTransformationConfigs(pipelineID)

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
    const pipelineID = req.body.pipelineID

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
    
    // Initialize transformationEvent (to be sent to Notification Queue)
    const transformationEvent : TransformationEvent= {
      "pipelineId": pipelineID,
      "pipelineName": 'TODO: Get Pipeline ID from endpoint caller/queue publisher',
      "dataLocation": transformation.dataLocation,
      "jobResult": result
    }
  
    this.amqpHandler.notifyNotificationService(transformationEvent)

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
