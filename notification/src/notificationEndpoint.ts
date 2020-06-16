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

    // // Deletion of Configs
    this.app.delete('/notifications/:id', this.determineAuth(), this.handleNotificationDelete)
    this.app.delete('/pipelines/:pipelineId/notifications', this.determineAuth(), this.handlePipelineDelete)

    // Creation of Configs
    this.app.post('/notifications/', this.determineAuth(), this.handleNotificaitonCreate)

    // // Update of Configs
    this.app.put('/notifications/:id', this.determineAuth(), this.handleNotificaitonUpdate)

    // Request Configs

    this.app.get('/pipelines/:pipelineId/notifications', this.determineAuth(), this.getConfigs)
    this.app.get('/notifications/:id', this.determineAuth(), this.getConfig)
        //this.app.post('/webhook', this.determineAuth(), this.postWebhook)
    // this.app.post('/fcm', this.determineAuth(), this.postFirebase)
    // this.app.post('/fcm', this.determineAuth(), this.postFirebase)
    console.log("Init Connection to Database")

    this.storageHandler.initConnection(5, 5)
    amqpHandler.connect(5,5)
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
   * (identified by param pipelineId) as json list
   */
  getConfigs = async (req: Request, res: Response) => {

    const pipelineId = parseInt(req.params.pipelineId)
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
      config.type = "FCM"
      configs.push(config)
    })

    configSummary.slack.forEach((slackConfig) => {
      const config = Object.assign({}, slackConfig) as any
      config.type = "SLACK"
      configs.push(config)
    })

    configSummary.firebase.forEach((webhookConfig) => {
      const config = Object.assign({}, webhookConfig) as any
      config.type = "WEBHOOK"
      configs.push(config)
    })

    res.status(200).send(configs)
  }

  /**
   * Gets the notification config corresponding to corresponnding id
   */
  getConfig = (req: Request, res: Response): void => {

    const id = parseInt(req.params.id)
    console.log(`Received request for config ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error("Request for config: id not set")
      res.status(400).send('Notification config id is not set.')
      return
    }

    // Get config from database
    let config = {} // TODO: get from db

    if (!config) {
      res.status(400).send(`Notification config with id ${id} does not exist!`)
      return
    }

    res.status(200).send(config)
  }

  /**
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleNotificaitonCreate  = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received notification config from Host ${req.connection.remoteAddress}`)

    let configRequest = req.body as NotficationConfigRequest
    if (!NotificationEndpoint.isValidNotificationConfigRequest(configRequest)) {
      res.status(400).send('Malformed notification request.')
      return
    }

    switch(configRequest.type) {
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
        res.status(400).send(`Notification type ${configRequest.type} not suppoerted!`)
        return
    }
  }

  /**
   * Handles a request to save a WebhookConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleWebhookRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Webhook config from Host ${req.connection.remoteAddress}`)

    var webHookConfig = req.body as WebHookConfig

    // Check for validity of the request
    if (!NotificationEndpoint.isValidWebhookConfig(webHookConfig)) {
      console.warn('Malformed webhook request.')
      res.status(400).send('Malformed webhook request.')
    }

    // Persist Config
    try {
      await this.storageHandler.saveWebhookConfig(webHookConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(200).send('OK');
  }

  /*
   * Persists a posted Slack Config to the Database
   */
  handleSlackRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    var slackConfig: SlackConfig = req.body as SlackConfig

     // Check for validity of the request
    if (!NotificationEndpoint.isValidSlackConfig(slackConfig)) {
      console.warn('Malformed slack request.')
      res.status(400).send('Malformed slack request.')
      return
    }

    // Persist Config
    try {
      await this.storageHandler.saveSlackConfig(slackConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed slack config request.')
      return

    }

    // return saved post back
    res.send(200);
  }

  /**
   * Persists a posted Firebase Config to the notifcation database service.
   */
  handleFCMRequest = async (req: Request, res: Response) => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    var firebaseConfig : FirebaseConfig = req.body as FirebaseConfig


    // Check for validity of the request
    if (!NotificationEndpoint.isValidFirebaseConfig(firebaseConfig)) {
      console.warn('Malformed FireBase request.')
      res.status(400).send('Malformed FireBase request.')
    }

    try {
      await this.storageHandler.saveFirebaseConfig(firebaseConfig)
    } catch (error) {
      console.error(`Could not create Firebase Object: ${error}`)
      res.status(400).send('Malformed firebase request.')
      return
    }

    // return saved post back
    res.send(200);
  }

  handleNotificationDelete = (req: Request, res: Response): void => {
    // call deleteSlack / deleteWebHook / deleteFCM based on notification type

    const id = parseInt(req.params.id)
    console.log(`Received config-deletion-request for pipline with id "${id}" from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error("Request for pipeline config deletion: id not set")
      res.status(400).send('Pipeline id is not set.')
      return
    }

    

  }

  deleteSlack = (req: Request, res: Response): void => {
    
  }

  deleteWebHook = (req: Request, res: Response): void => {

  }

  deleteFCM = (req: Request, res: Response): void => {
  }

  handlePipelineDelete = (req: Request, res: Response): void => {
  }

  /*
   * Handles a request to update a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleNotificaitonUpdate  = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received notification config from Host ${req.connection.remoteAddress}`)

    const id = parseInt(req.params.id)
    // delete with notification id
    // save with id
    // or implement an update method!
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
    return !!obj.pipelineName && !!obj.pipelineId && !!obj.condition
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
    return !!obj.pipelineName && !!obj.pipelineId && !!obj.condition && !!obj.type
  }
}
