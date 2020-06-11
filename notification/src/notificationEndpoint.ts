import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import NotificationService from './interfaces/notificationService'
import { getManager, createConnection, ConnectionOptions, Connection, getConnection } from "typeorm"
import "reflect-metadata"

import { Server } from 'http'

import { SlackConfig, FirebaseConfigRequest, NotificationConfigRequest, SlackConfigRequest, WebHookConfigRequest, WebHookConfig, NotificationConfig, FirebaseConfig } from './interfaces/notificationConfig';
import { StorageHandler } from './storageHandler';

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
    // this.app.delete('/slack', this.determineAuth(), this.handleSlackDelete)
    // this.app.delete('/webhook', this.determineAuth(), this.handleWebHookDelete)
    // this.app.delete('/fcm', this.determineAuth(), this.handleFCMDelete)

    // Creation of Configs
    this.app.post('/slack', this.determineAuth(), this.handleSlackRequest)
    this.app.post('/webhook', this.determineAuth(), this.handleWebhookRequest)
    this.app.post('/fcm', this.determineAuth(), this.handleFCMRequest)

    // // Update of Configs
    // this.app.post('/slack/:id', this.determineAuth(), this.updateSlackConfig)
    // this.app.post('/webhook/:id', this.determineAuth(), this.updateWebhookConfig)
    // this.app.post('/fcm/:id', this.determineAuth(), this.updateFCMConfig)

    // Request Configs

    this.app.get('/conf/:id', this.determineAuth(), this.getConfigs)
        //this.app.post('/webhook', this.determineAuth(), this.postWebhook)
    // this.app.post('/fcm', this.determineAuth(), this.postFirebase)
    // this.app.post('/fcm', this.determineAuth(), this.postFirebase)
    console.log("Init Connection to Database")
    this.StorageHandler.initConnection(5,5)
    
  }

  
  listen (): Server {
    return this.app.listen(this.port, () => {
      console.log('listening on port ' + this.port)
      
      // const amqp = require("amqplib/callback_api");
      // const rabbit_url = process.env.RABBIT_SERVICE_URL;
      // const rabbit_usr = process.env.RABBIT_SERVICE_USR;
      // const rabbit_password = process.env.RABBIT_SERVICE_PWD;

      // const rabit_amqp_url = 'amqp://' + rabbit_usr + ':' + rabbit_password + '@' + rabbit_url;
      // console.log("URL"+rabit_amqp_url)
      // amqp.connect(rabit_amqp_url, function (error0: string, connection: object) {
      //   if (error0) {
      //     console.error("Error connecting to RabbitMQ: " + error0);
      //     exit - 1;
      //   }
      //   console.log("Connected to RabbitMQ.");

      //    connection.createChannel(function (error1, channel) {
      //      if (error1) {
      //        throw error1;
      //      }

      //      var queue = "test_queue";

      //      channel.assertQueue(queue, {
      //        durable: false,
      //      });

      //      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);

      //      channel.consume(
      //        queue,
      //        function (msg:object) {
      //          console.log(" [x] Received %s", msg.content.toString());
      //        },
      //        {
      //          noAck: true,
      //        }
      //      );
      //    });
      // });


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
    
    const slackConfigs = this.StorageHandler.getSlackConfigs(pipelineID)
    const webHookConfigs = this.StorageHandler.getWebHookConfigs(pipelineID)
    const firebaseConfig = this.StorageHandler.getFirebaseConfigs(pipelineID)

    // wait for the Configs to be received from DB
    Promise.all([webHookConfigs, slackConfigs, firebaseConfig]).then(configs => {
      
      if (!configs || !configs[0] || !configs[1] || !configs[2]) {
        res.status(500).send('Internal Server Error')
        return
      }

      res.status(200).send(configs);  
    })
    // if (!slackConfigs) {
    //   res.status(500).send('Internal Server Error')
    // }
  }

  /**===========================================================================
   * Persists a posted Webhook Config to the Database
   *============================================================================*/
  handleWebhookRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received Webhook config from Host ${req.connection.remoteAddress}`)

    var webHookConfig: WebHookConfig[]

    // Init Repository for WebHook Config
    console.debug("Init Repository")
    const postRepository = getConnection().getRepository(WebHookConfig)

    // create object from Body of the Request (=WebHookConfig)
    console.debug("Init SlackConfig")
    try {
        webHookConfig = postRepository.create(req.body)
    } catch (error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed webhook request.')
      return
    }

    // Check for validity of the request
    if (!NotificationEndpoint.isValidWebhookRequest(webHookConfig)) {
      console.warn('Malformed webhook request.')
      res.status(400).send('Malformed webhook request.')
    }

    // persist the Config
    console.debug("Save WebHookConfig to Repository")
    postRepository.save(webHookConfig);
    console.log("Webhook config persisted")

    // return saved post back
    res.status(200).send('OK');
    
  }

  /**===========================================================================
   * Persists a posted Slack Config to the Database
   *============================================================================*/
  handleSlackRequest = async (req: Request, res: Response): Promise<void> => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)
    
    var slackConfig : SlackConfig[]

    // Init Repository for Slack Config
    console.debug("Init Repository")
    const postRepository = getConnection().getRepository(SlackConfig)

    try {
      console.debug("Init SlackConfig")
      // create object from Body of the Request (=SlackConfig)
      slackConfig = postRepository.create(req.body)
    } catch (error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed slack config request.')
      return
    }

    // Check for validity of the request
    if (!NotificationEndpoint.isValidSlackRequest(slackConfig)) {
      console.warn('Malformed slack request.')
      res.status(400).send('Malformed slack request.')
      return
    }

      // persist the Config
      console.debug("Save SlackConfig to Repository")
      postRepository.save(slackConfig);
      console.log("Slack config persisted")
  
    // return saved post back
    res.send(200);
  }

  /**===========================================================================
   * Persists a posted Slack Config to the Database
   *============================================================================*/
  handleFCMRequest = (req: Request, res: Response): void => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    var firebaseConfig : FirebaseConfig[]
    
    // Init Repository for Slack Config
    console.debug("Init Repository")
    const postRepository = getConnection().getRepository(FirebaseConfig)

    // create object from Body of the Request (=SlackConfig)
    console.debug("Init SlackConfig")
    try {
      firebaseConfig = postRepository.create(req.body)
    } catch (error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed firebase request.')
      return
    }

    // Check for validity of the request
    if (!NotificationEndpoint.isValidFirebaseRequest(firebaseConfig)) {
      console.warn('Malformed FireBase request.')
      res.status(400).send('Malformed FireBase request.')
    }

    // persist the Config
    console.debug("Save FireBase config to Repository")
    postRepository.save(firebaseConfig);
    console.log("FireBase config persisted")

    // return saved post back
    res.send(200);
  }

  // postWebhook = async (req: Request, res: Response): Promise<void> => {
  //   const webhookRequest = req.body as WebHookConfigRequest
  //   if (!NotificationEndpoint.isValidWebhookRequest(webhookRequest)) {
  //     res.status(400).send('Malformed webhook request.')
  //   }
  //   await this.processNotificationRequest(webhookRequest, res)
  // }

  // postSlack = async (req: Request, res: Response): Promise<void> => {
  //   const slackRequest = req.body as SlackConfigRequest
  //   if (!NotificationEndpoint.isValidSlackRequest(slackRequest)) {
  //     res.status(400).send('Malformed webhook request.')
  //   }
  //   await this.processNotificationRequest(slackRequest, res)
  // }

  // postFirebase = async (req: Request, res: Response): Promise<void> => {
  //   const firebaseRequest = req.body as FirebaseConfigRequest
  //   if (!NotificationEndpoint.isValidFirebaseRequest(firebaseRequest)) {
  //     res.status(400).send('Malformed webhook request.')
  //   }
  //   await this.processNotificationRequest(firebaseRequest, res)
  // }

  processNotificationRequest = async (notification: NotificationConfigRequest, res: Response): Promise<void> => {
    try {
      await this.NotificationService.handleNotification(notification)
    } catch (e) {
      if (e instanceof Error) {
        console.log(`Notification handling failed. Nested cause is: ${e.name}: ${e.message}`)
        res.status(500).send(`Notification handling failed. Nested cause is: ${e.name}: ${e.message}`)
      } else {
        res.status(500).send()
      }
    }
    res.status(200).send()
  }

  determineAuth = (): express.RequestHandler | [] => {
    if (this.keycloak !== undefined) {
      return this.keycloak.protect()
    } else {
      return []
    }
  }

  private static isValidWebhookRequest(obj: WebHookConfig[]): boolean {
    for (let conf of obj) {
      if (!this.isValidNotificationRequest(conf) || !conf.url)
        return false
    }
    return true
  }

  private static isValidSlackRequest(obj: SlackConfig[]): boolean {
    for (let conf of obj) {
      if (!this.isValidNotificationRequest(conf) || !conf.channelId || !conf.secret || !conf.workspaceId) {
        return false
      }
    }
    return true
  }

  private static isValidFirebaseRequest(obj: FirebaseConfig[]): boolean {
    for (let conf of obj) {
      if (!this.isValidNotificationRequest(conf) || !conf.clientEmail || !conf.privateKey || !conf.projectId || !conf.topic){
        return false
      }
    }

    return true
  }

  private static isValidNotificationRequest (obj: NotificationConfig): boolean {
    return !!obj.data && !!obj.pipelineName && !!obj.pipelineId && !!obj.condition && !!obj.dataLocation
  }
}
