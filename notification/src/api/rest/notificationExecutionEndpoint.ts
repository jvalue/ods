import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import NotificationService from '@/notification-execution/notificationService'

import { Server } from 'http'

import { Firebase, NotificationRequest, Slack, Webhook } from './notificationRequest'
import { NotificationConfig, CONFIG_TYPE } from '@/notification-config/notificationConfig'
import { TransformationEvent } from '@/notification-execution/condition-evaluation/transformationEvent'

export class NotificationEndpoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  NotificationService: NotificationService

  constructor (NotificationService: NotificationService, port: number, auth: boolean) {
    this.port = port
    this.NotificationService = NotificationService

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
    this.app.post('/webhook', this.determineAuth(), this.postWebhook)
    this.app.post('/slack', this.determineAuth(), this.postSlack)
    this.app.post('/fcm', this.determineAuth(), this.postFirebase)
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

  postWebhook = async (req: Request, res: Response): Promise<void> => {
    const webhookRequest = req.body as Webhook
    if (!NotificationEndpoint.isValidWebhookRequest(webhookRequest)) {
      res.status(400).send('Malformed webhook request.')
    }
    await this.processNotificationRequest(webhookRequest, CONFIG_TYPE.WEBHOOK, res)
    await this.NotificationService.handleNotification
  }

  postSlack = async (req: Request, res: Response): Promise<void> => {
    const slackRequest = req.body as Slack
    if (!NotificationEndpoint.isValidSlackRequest(slackRequest)) {
      res.status(400).send('Malformed webhook request.')
    }
    await this.processNotificationRequest(slackRequest, CONFIG_TYPE.SLACK, res)
  }

  postFirebase = async (req: Request, res: Response): Promise<void> => {
    const firebaseRequest = req.body as Firebase
    if (!NotificationEndpoint.isValidFirebaseRequest(firebaseRequest)) {
      res.status(400).send('Malformed webhook request.')
    }
    await this.processNotificationRequest(firebaseRequest, CONFIG_TYPE.FCM, res)
  }

  processNotificationRequest = async (notification: NotificationRequest, configType: CONFIG_TYPE, res: Response): Promise<void> => {
    try {
      const event: TransformationEvent = { // TODO: refactor this out after migration to events!
        dataLocation: notification.dataLocation,
        jobResult: {
          stats: {
            durationInMilliSeconds: -1,
            startTimestamp: -1,
            endTimestamp: -1,
          }
        },
        pipelineId: notification.pipelineId,
        pipelineName: notification.pipelineName
      }
      await this.NotificationService.handleNotification(notification, event, configType)
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

  private static isValidWebhookRequest (obj: Webhook): boolean {
    return this.isValidNotificationRequest(obj) &&
      obj.type === 'WEBHOOK'
  }

  private static isValidSlackRequest (obj: Slack): boolean {
    return this.isValidNotificationRequest(obj) &&
      obj.type === 'SLACK' && !!obj.channelId && !!obj.secret && !!obj.workspaceId
  }

  private static isValidFirebaseRequest (obj: Firebase): boolean {
    return this.isValidNotificationRequest(obj) &&
      obj.type === 'FCM' && !!obj.clientEmail && !!obj.privateKey && !!obj.projectId && !!obj.topic
  }

  private static isValidNotificationRequest (obj: NotificationRequest): boolean {
    return !!obj.data && !!obj.pipelineName && !!obj.pipelineId && !!obj.condition && !!obj.dataLocation
  }
}
