import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import NotificationService from './interfaces/notificationService'
import { getConnection } from "typeorm"
import "reflect-metadata"

import { Server } from 'http'

import { SlackConfig, NotificationConfigRequest, WebHookConfig, NotificationConfig, FirebaseConfig } from './interfaces/notificationConfig';
import { StorageHandler } from './storageHandler';
import { AmqpHandler } from './amqpHandler';

export class NotificationEndpoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  NotificationService: NotificationService
  StorageHandler: StorageHandler


  constructor(NotificationService: NotificationService, storageHandler: StorageHandler, port: number, auth: boolean) {
    this.port = port
    this.NotificationService = NotificationService
    this.StorageHandler = storageHandler

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
    this.app.delete('notifications/:id', this.determineAuth(), this.handleNotificationDelete)
    this.app.delete('pipelines/:pipelineId/notifications', this.determineAuth(), this.handlePipelineDelete)

    // Creation of Configs
    this.app.post('notificaitons/', this.determineAuth(), this.handleNotificaitonCreate)

    // // Update of Configs
    this.app.put('notificaitons/:id', this.determineAuth(), this.handleNotificaitonUpdate)

    // Request Configs

    this.app.get('/pipelines/:pipelineId/notifications', this.determineAuth(), this.getConfigs)
    this.app.get('/notifications/:id', this.determineAuth(), this.getConfig)
        //this.app.post('/webhook', this.determineAuth(), this.postWebhook)
    // this.app.post('/fcm', this.determineAuth(), this.postFirebase)
    // this.app.post('/fcm', this.determineAuth(), this.postFirebase)
    console.log("Init Connection to Database")

    this.StorageHandler.initConnection(5, 5)
    AmqpHandler.connect(5,5)
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

  /**===============================================================================
   * Gets all Configs asto corresponding to corresponnding Pipeline-ID
   * (identified by param pipelineId) as json list
   *================================================================================*/
  getConfigs = (req: Request, res: Response): void => {

    const pipelineId = parseInt(req.params.pipelineId)
    console.log(`Received request for configs with pipeline id ${pipelineId} from Host ${req.connection.remoteAddress}`)

    if (!pipelineId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Get configs from database
    let configs = this.StorageHandler.getConfigsForPipeline(pipelineId)

    if (!configs) {
      res.status(500).send('Internal Server Error')
      return
    }

    // Get configSummary from promise
    configs.then(configSummary =>{
      if (!configSummary) {
        res.status(500).send('Internal Server Error')
        return
      }

      res.status(200).send(configSummary)
    })
  }

  /**===============================================================================
   * Gets the notification config corresponding to corresponnding id
   *================================================================================*/
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

  /**===========================================================================
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   *============================================================================*/
  handleNotificaitonCreate  = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received notification config from Host ${req.connection.remoteAddress}`)

    const notificationType = req.body?.type
    if (!notificaitonConfig || !notificationType) {
      res.status(400).send('Malformed notification request.')
      return
    }

    switch(notificationType) {
      case 'WEBHOOK':
        this.handleWebhookRequest(req, res)
        break
      case 'FCM':
        this.handleFCMRequest(req, res)
        break
      case 'SLACK':
        this.handleSlackRequest(req, res)
        break
      default:
        res.status(400).send(`Notification type ${notificationType} not suppoerted!`)
        return
    }
  }

  /**===========================================================================
   * Handles a request to save a WebhookConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   *============================================================================*/
  handleWebhookRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Webhook config from Host ${req.connection.remoteAddress}`)

    var webHookConfig = req.body as WebHookConfig

    // Check for validity of the request
    if (!NotificationEndpoint.isValidWebhookRequest( webHookConfig)) {
      console.warn('Malformed webhook request.')
      res.status(400).send('Malformed webhook request.')
    }

    // Persist Config
    try {
      this.StorageHandler.saveWebhookConfig(webHookConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(200).send('OK');
  }

  /**===========================================================================
   * Persists a posted Slack Config to the Database
   *============================================================================*/
  handleSlackRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    var slackConfig: SlackConfig = req.body as SlackConfig

     // Check for validity of the request
    if (!NotificationEndpoint.isValidSlackRequest(slackConfig)) {
      console.warn('Malformed slack request.')
      res.status(400).send('Malformed slack request.')
      return
    }

    // Persist Config
    try {
      this.StorageHandler.saveSlackConfig(slackConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed slack config request.')
      return

    }

    // return saved post back
    res.send(200);
  }

  /**===========================================================================
   * Persists a posted Firebase Config to the Database
   *============================================================================*/
  handleFCMRequest = (req: Request, res: Response): void => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    var firebaseConfig : FirebaseConfig = req.body as FirebaseConfig


    // Check for validity of the request
    if (!NotificationEndpoint.isValidFirebaseRequest(firebaseConfig)) {
      console.warn('Malformed FireBase request.')
      res.status(400).send('Malformed FireBase request.')
    }

    try {
      this.StorageHandler.saveFirebaseConfig(firebaseConfig)
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
  }

  deleteSlack = (req: Request, res: Response): void => {

  }

  deleteWebHook = (req: Request, res: Response): void => {

  }

  deleteFCM = (req: Request, res: Response): void => {
  }

  handlePipelineDelete = (req: Request, res: Response): void => {
  }


  // processNotificationRequest = async (notification: NotificationConfigRequest, res: Response): Promise<void> => {
  //   try {
  //     await this.NotificationService.handleNotification(notification)
  //   } catch (e) {
  //     if (e instanceof Error) {
  //       console.log(`Notification handling failed. Nested cause is: ${e.name}: ${e.message}`)
  //       res.status(500).send(`Notification handling failed. Nested cause is: ${e.name}: ${e.message}`)
  //     } else {
  //       res.status(500).send()
  //     }
  //   }
  //   res.status(200).send()
  // }

  determineAuth = (): express.RequestHandler | [] => {
    if (this.keycloak !== undefined) {
      return this.keycloak.protect()
    } else {
      return []
    }
  }

  private static isValidWebhookRequest(conf: WebHookConfig): boolean {
    return this.isValidNotificationRequest(conf) && !!conf.url
  }


  private static isValidSlackRequest(conf: SlackConfig): boolean {
      return this.isValidNotificationRequest(conf) && !!conf.channelId && !!conf.secret && !!conf.workspaceId
  }

  private static isValidFirebaseRequest(conf: FirebaseConfig): boolean {
      return this.isValidNotificationRequest(conf) && !!conf.clientEmail && !!conf.privateKey || !conf.projectId || !conf.topic
  }

  private static isValidNotificationRequest (obj: NotificationConfig): boolean {
    return !!obj.data && !!obj.pipelineName && !!obj.pipelineId && !!obj.condition && !!obj.dataLocation
  }
}
