import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import TransformationService from './interfaces/transformationService'
import TransformationRequest from './interfaces/transformationRequest'
import { NotificationRequest_v1 } from './interfaces/notificationRequest_v1'
import { Server } from 'http'
import JobResult from './interfaces/jobResult'
import {Firebase, NotificationRequest, Slack, Webhook} from '@/interfaces/notificationRequest'

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
    this.app.post('/notification/webhook', this.determineAuth(), this.postWebhook)
    this.app.post('/notification/slack', this.determineAuth(), this.postSlack)
    this.app.post('/notification/fcm', this.determineAuth(), this.postFirebase)
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

  postJob = (req: Request, res: Response): void => {
    const transformation: TransformationRequest = req.body
    const result: JobResult = this.transformationService.executeJob(transformation.func, transformation.data)
    const answer: string = JSON.stringify(result)
    res.setHeader('Content-Type', 'application/json')
    if (result.data) {
      res.writeHead(200)
    } else {
      res.writeHead(400)
    }
    res.write(answer)
    res.end()
  }

  postWebhook = async (req: Request, res: Response): Promise<void> => {
    const webhookRequest = req.body as Webhook
    if (!TransformationEndpoint.isValidWebhookRequest(webhookRequest)) {
      res.status(400).send('Malformed webhook request.')
    }
    await this.processNotificationRequest(webhookRequest, res)
  }

  postSlack = async (req: Request, res: Response): Promise<void> => {
    const slackRequest = req.body as Slack
    if (!TransformationEndpoint.isValidSlackRequest(slackRequest)) {
      res.status(400).send('Malformed webhook request.')
    }
    await this.processNotificationRequest(slackRequest, res)
  }

  postFirebase = async (req: Request, res: Response): Promise<void> => {
    const firebaseRequest = req.body as Firebase
    if (!TransformationEndpoint.isValidFirebaseRequest(firebaseRequest)) {
      res.status(400).send('Malformed webhook request.')
    }
    await this.processNotificationRequest(firebaseRequest, res)
  }

  processNotificationRequest = async (notification: NotificationRequest, res: Response): Promise<void> => {
    try {
      await this.transformationService.handleNotification(notification)
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
