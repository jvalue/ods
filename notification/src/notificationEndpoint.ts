import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import NotificationService from './interfaces/notificationService';
import "reflect-metadata"

import { Server } from 'http'

import { SlackConfig, WebHookConfig, NotificationConfig, FirebaseConfig, NotficationConfigRequest, CONFIG_TYPE } from './models/notificationConfig';
import { NotificationRepository } from './interfaces/notificationRepository'
import { AmqpHandler } from './handlers/amqpHandler';
import { DeleteResult } from 'typeorm';

export class NotificationEndpoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  NotificationService: NotificationService
  storageHandler: NotificationRepository
  amqpHandler: AmqpHandler


  constructor(NotificationService: NotificationService, storageHandler: NotificationRepository, amqpHandler: AmqpHandler, port: number, auth: boolean) {
    this.port = port
    this.NotificationService = NotificationService
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
 
    // All Configs
    this.app.get('/config/pipeline/:id', this.determineAuth(), this.handleConfigSummaryRequest)

    // Create Configs
    this.app.post('/config/:configType', this.determineAuth(), this.handleConfigCreation)

    // Update of Configs
    this.app.put('/config/:configType/:id', this.determineAuth(), this.handleConfigUpdate)

    // Deletion of Configs
    this.app.delete('/config/:configType/:id/', this.determineAuth(), this.handleConfigDeletion)

    // Request Configs
    this.app.get('/config/:configType', this.determineAuth(), this.handleConfigRequest)

    this.storageHandler.init(30, 5)
    amqpHandler.connect(30,5)
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
    res.send(this.NotificationService.getVersion())
    res.end()
  }

  /**
   * Gets all Configs asto corresponding to corresponnding Pipeline-ID
   * (identified by param id) as json list
   */
  handleConfigSummaryRequest = async (req: Request, res: Response) => {

    const pipelineId = parseInt(req.params.id)
    console.log(`Received request for configs with pipeline id ${pipelineId} from Host ${req.connection.remoteAddress}`)

    if (!pipelineId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Get configs from database
    const configSummary = await this.storageHandler.getConfigsForPipeline(pipelineId)
    const configs: object[] = []

    configSummary.firebase.forEach((firebaseConfig) => {
      const config = Object.assign({}, firebaseConfig) as any
      config.type = CONFIG_TYPE.FCM
      configs.push(config)
    })

    configSummary.slack.forEach((slackConfig) => {
      const config = Object.assign({}, slackConfig) as any
      config.type = CONFIG_TYPE.SLACK
      configs.push(config)
    })

    configSummary.webhook.forEach((webhookConfig) => {
      const config = Object.assign({}, webhookConfig) as any
      config.type = CONFIG_TYPE.WEBHOOK
      configs.push(config)
    })

    res.status(200).send(configs)
  }

  /**
    * Gets all Slack Configs corresponding to corresponnding config id
    * (identified by param id) as json list
    */
  handleSlackRequest = async (req: Request, res: Response) => {
    const queryParams = req.query
    console.log(`Received request for slack config with queryParams ${JSON.stringify(queryParams)} from Host ${req.connection.remoteAddress}`)

    // Get configs from database
    const configs = await this.storageHandler.getSlackConfigs(queryParams)
    
    if (!configs) {
      console.error(`Could not get slack config with query parameters "${JSON.stringify(queryParams)}" from database`)
      res.status(500).send('Internal Server error.')
      res.end()
      return
    }

    res.status(200).send(configs)
  }

  /**
   * Gets all Webhook Configs corresponding to corresponnding config id
   * (identified by param id) as json list
   */
  handleWebhookRequest = async (req: Request, res: Response) => {
    const queryParams = req.query
    console.log(`Received request for webhook config with query parameters ${JSON.stringify(queryParams)} from Host ${req.connection.remoteAddress}`)

    // Get configs from database
    const configs = await this.storageHandler.getWebHookConfigs(queryParams)

    if (!configs) {
      console.error(`Could not get webhook config with query parameters ${JSON.stringify(queryParams)} from database`)
      res.status(500).send('Internal Server error.')
      res.end()
      return
    }

    res.status(200).send(configs)
  }

  /**
   * Gets all Firebase Configs corresponding to corresponnding config id
   * (identified by param id) as json list
   */
  handleFCMRequest = async (req: Request, res: Response) => {
    const queryParams = req.query
    console.log(`Received request for firebase config with query parameters ${JSON.stringify(queryParams)} from Host ${req.connection.remoteAddress}`)

    // Get configs from database
    const configs = await this.storageHandler.getFirebaseConfigs(queryParams)

    if (!configs) {
      console.error(`Could not get firebase config with query parameters ${JSON.stringify(queryParams)} from database`)
      res.status(500).send('Internal Server error.')
      res.end()
      return
    }

    res.status(200).send(configs)
  }

  /**
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigCreation  = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received notification config from Host ${req.connection.remoteAddress}`)

    const notificationType = req.params.configType

    if (!notificationType) {
      console.error('No notification type provided')
      res.status(400).send('No notification type provided')
      res.end()
      return
    }

    const configRequest = req.body as NotificationConfig

    if (!NotificationEndpoint.isValidNotificationConfig(configRequest)) {
      res.status(400).send('Malformed notification request.')
      return
    }

    switch(notificationType) {
      case CONFIG_TYPE.WEBHOOK:
        this.handleWebhookCreation(req, res)
        break
      case CONFIG_TYPE.FCM:
        this.handleFCMCreation(req, res)
        break
      case CONFIG_TYPE.SLACK:
        this.handleSlackCreation(req, res)
        break
      default:
        res.status(400).send(`Notification type ${notificationType} not suppoerted!`)
        return
    }
  }

  /**
   * Handles a request to save a WebhookConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleWebhookCreation = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Webhook config from Host ${req.connection.remoteAddress}`)

    const webHookConfig = req.body as WebHookConfig
    let savedConfig: WebHookConfig
    
    // Check for validity of the request
    if (!NotificationEndpoint.isValidWebhookConfig(webHookConfig)) {
      console.warn('Malformed webhook request.')
      res.status(400).send('Malformed webhook request.')
    }

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveWebhookConfig(webHookConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(200).send(savedConfig);
  }


  /**
   * Persists a posted Slack Config to the Database
   * 
   * @param req Request for config creation
   * @param res Response for config creation
   */
  handleSlackCreation = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    const slackConfig: SlackConfig = req.body as SlackConfig
    let savedConfig: SlackConfig
    
     // Check for validity of the request
    if (!NotificationEndpoint.isValidSlackConfig(slackConfig)) {
      console.warn('Malformed slack request.')
      res.status(400).send('Malformed slack request.')
      return
    }

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveSlackConfig(slackConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed slack config request.')
      return

    }

    // return saved post back
    res.status(200).send(savedConfig);
  }

  /**
   * Persists a posted Firebase Config to the notifcation database service.
   */
  handleFCMCreation = async (req: Request, res: Response) => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    const firebaseConfig : FirebaseConfig = req.body as FirebaseConfig
    let savedConfig: FirebaseConfig
    

    // Check for validity of the request
    if (!NotificationEndpoint.isValidFirebaseConfig(firebaseConfig)) {
      console.warn('Malformed FireBase request.')
      res.status(400).send('Malformed FireBase request.')
    }

    try {
      savedConfig = await this.storageHandler.saveFirebaseConfig(firebaseConfig)
    } catch (error) {
      console.error(`Could not create Firebase Object: ${error}`)
      res.status(400).send('Malformed firebase request.')
      return
    }

    // return saved post back
    res.status(200).send(savedConfig);
  }


  /**
   * Handles a requeset for config deletion.
   * Depending on the paramter :configType in the URL it either deletes a config 
   * of a specific config type (such as slack) or deletes all configs 
   * for a specific pipeline
   * 
   * @param req request containing the paramter :configType and the :id of the config
   *            or respectively the pipeline id for the configs to be deleted
   * 
   * @param res HTTP-Response that is sent back to the requester
   * 
   */
  handleConfigDeletion = (req: Request, res: Response): void => {

    const configType = req.params.configType

    if (!configType) {
      console.warn(`Cannot delete Pipeline: Not valid config type provided`)
      res.status(400).send(`Cannot delete Pipeline: Not valid config type provided`)
      res.end()
      return
    }

    switch (configType) {
      case CONFIG_TYPE.WEBHOOK:
        this.deleteWebHook(req,res)
        break
      
      case CONFIG_TYPE.FCM:
        this.deleteFCM(req,res)
        break
      
      case CONFIG_TYPE.SLACK:
        this.deleteSlack(req,res)
        break
      
      case 'pipeline':
        this.handlePipelineDelete(req, res)
        break
      default:
        res.status(400).send(`Notification type ${configType} not suppoerted!`)
        return
    }

  }

  /**
   * Handles a request for configs and returns the configs corresponding to the parameter :configType
   * as a HTTP- Response
   * 
   * @param req Request for a Config.
   * @param res Response containing  specific configs, such as slack or  all configs for a pipeline 
   */
  handleConfigRequest = (req: Request, res: Response): void => {

    const configType = req.params.configType

    if (!configType) {
      console.warn(`Cannot request config(s): Not valid config type provided`)
      res.status(400).send(`Cannot request config(s): Not valid config type provided`)
      res.end()
      return
    }

    switch (configType) {
      case CONFIG_TYPE.WEBHOOK:
        this.handleWebhookRequest(req, res)
        break

      case CONFIG_TYPE.FCM:
        this.handleFCMRequest(req, res)
        break

      case CONFIG_TYPE.SLACK:
        this.handleSlackRequest(req, res)
        break

      default:
        res.status(400).send(`Notification type ${configType} not suppoerted!`)
        return
    }

  }

  handlePipelineDelete = (req: Request, res: Response): void => {
    
    const pipelineId = parseInt(req.params.id)

    if (!pipelineId) {
      console.warn(`Cannot delete Pipeline: Not valid id provided`)
      res.status(400).send(`Cannot delete Pipeline: Not valid id provided`)
      res.end()
      return
    }

    console.log(`Received config-deletion-request for pipline with id "${pipelineId}" from Host ${req.connection.remoteAddress}`)

    // Delete All Configs with given pipelineId
    try {
      this.storageHandler.deleteConfigsForPipelineID(pipelineId)
    } catch (error) {
      console.error(`Could not delete configs with pipelineID ${pipelineId}: ${error}`)
      res.status(400).send('Internal Server Error.')
      res.end()
      return
    }

    // return saved post back
    res.status(200).send('Configs have been deleted.');
    res.end()
  }

  /**
   * Handles slack config  deletion requests.
   * 
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteSlack = async (req: Request, res: Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    let deleteResult : DeleteResult

    console.log(`Received deletion request for slack config with id ${configId} from Host ${req.connection.remoteAddress}`)

    if (!configId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    try {
      deleteResult = await this.storageHandler.deleteSlackConfig(configId)

      // No Deletion done
      if (deleteResult.affected != 1) {
        const msg = `Could not delete Slack Config: Config with id ${configId} not found.`
        console.log(msg)
        res.status(400).send(msg)
      }

    } catch (error) {
      console.error(`Could not delete slack config  with id ${configId}: ${error}`)
      res.status(400).send('Internal Server Error.')
      res.end()
      return
    }

    // return saved post back
    res.status(200).send('DELETED');
    res.end()
  }


  /**
    * Handles Firebase config deletion requests.
    * 
    * @param req Deletion Request containing parameter id (id to be deleted)
    * @param res Response to the Deletion request
    */
  deleteFCM = async (req: Request, res: Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    let deleteResult: DeleteResult

    console.log(`Received deletion request for firebase configs with id ${configId} from Host ${req.connection.remoteAddress}`)

    if (!configId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    try {
      deleteResult = await this.storageHandler.deleteFirebaseConfig(configId)

      // No Deletion done
      if (deleteResult.affected != 1) {
        console.log(`Could not delete Firebase Config with id ${configId}`)
      }

    } catch (error) {
      console.error(`Could not delete firebase config  with id ${configId}: ${error}`)
      res.status(400).send('Internal Server Error.')
      res.end()
      return
    }

    // return saved post back
    res.status(200).send('DELETED');
    res.end()
  }


  /**
   * Handles Webhook deletion requests.
   * 
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteWebHook = async (req: Request, res: Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    let deleteResult: DeleteResult

    console.log(`Received deletion request for webhook configs with id ${configId} from Host ${req.connection.remoteAddress}`)

    if (!configId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return Promise.resolve()
    }

    // Delete Config
    try {
      deleteResult = await this.storageHandler.deleteWebhookConfig(configId)

      // No Deletion done
      if (deleteResult.affected != 1) {
        console.log(`Could not delete webhook Config with id ${configId}`)
      }

    } catch (error) {
      console.error(`Could not delete WebHook Config with id ${configId}: ${error}`)
      res.status(400).send('Internal Server Error.')
      res.end()
      return Promise.resolve()
    }

    // return saved post back
    res.status(200).send('DELETED');
    res.end()
  }

  /*
   * Handles a request to update a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigUpdate  = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received ${req.params.configType} config update for id "${req.params.id}" request from Host ${req.connection.remoteAddress}`)
    console.debug(`Received config: ${JSON.stringify(req.body)}`)
    const configType = req.params.configType
    const id = parseInt(req.params.id)
    const config = req.body as NotificationConfig

    if (!id) {
      console.warn(`No valid id for Notification Update Request provided`)
      res.send(400).send(`No valid id for Notification Update Request provided`)
      res.end()
      return Promise.resolve()
    }

    if (!configType) {
      console.warn(`No valid notification Type for Notification Update Request provided`)
      res.send(400).send(`No valid id for Notification Update Request provided`)
      res.end()
      return Promise.resolve()
    }

    if (!NotificationEndpoint.isValidNotificationConfig(config)) {
      console.warn(`Received malformed NoticationUpdate request: ${JSON.stringify(req.body)}`)
      res.status(400).send('Malformed Notification config.')
      res.end()
      return Promise.resolve()
    }

    try {
      switch (configType) {
        case 'webhook':
          this.storageHandler.updateWebhookConfig(id, req.body as WebHookConfig)
          break
        case 'fcm':
          const config = req.body as FirebaseConfig
          this.storageHandler.updateFirebaseConfig(id, req.body as FirebaseConfig)
          break
        case 'slack':
          this.storageHandler.updateSlackConfig(id, req.body as SlackConfig)
          break
        default:
          res.status(400).send(`Notification type ${configType} not suppoerted!`)
          return
      }
    } catch (err) {
      console.error(`Could not update ${configType} config: ${err}`)
      res.status(500).send(`Internal Server Error.`)
      res.end()
      return
    }

    res.status(200).send('Sucessfully updated.')
    res.end()
  }


  determineAuth = (): express.RequestHandler | [] => {
    if (this.keycloak !== undefined) {
      return this.keycloak.protect()
    } else {
      return []
    }
  }

  /**
   * Evaluates the validity of the WebHookConfig (provided by argument),
   * by checking for the field variables.
   * 
   * @param conf WebHookConfig to be validated
   * 
   * @returns true, if conf is a valid, false else
   */
  private static isValidWebhookConfig(conf: WebHookConfig): boolean {
    return this.isValidNotificationConfig(conf) && !!conf.url
  }

  /**
   * Evaluates the validity of the SlackConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf SlackConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidSlackConfig(conf: SlackConfig): boolean {
      return this.isValidNotificationConfig(conf) && !!conf.channelId && !!conf.secret && !!conf.workspaceId
  }


  /**
   * Evaluates the validity of the FirebaseConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf FirebaseConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidFirebaseConfig(conf: FirebaseConfig): boolean {
      return this.isValidNotificationConfig(conf) && !!conf.clientEmail && !!conf.privateKey || !conf.projectId || !conf.topic
  }


  /**
  * Evaluates the validity of the NotificationConfig (provided by argument),
  * by checking for the field variables.
  *
  * @param conf NotificationConfig to be validated
  *
  * @returns true, if conf is a valid, false else
  */
  private static isValidNotificationConfig (obj: NotificationConfig): boolean {
    return !!obj.pipelineId && !!obj.condition
  }

  /**
  * Evaluates the validity of the NotificationConfigRequest (provided by argument),
  * by checking for the field variables.
  *
  * @param conf NotificationConfigRequest to be validated
  *
  * @returns true, if conf is a valid, false else
  */
  private static isValidNotificationConfigRequest(obj: NotficationConfigRequest): boolean {
    return !!obj.pipelineId && !!obj.condition && !!obj.type
  }
}
