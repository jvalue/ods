
import express, { Application, Request, Response } from 'express'

import Keycloak from 'keycloak-connect'
import TransformationService from './interfaces/transformationService'
import TransformationRequest from './interfaces/transformationRequest'

import JobResult from './interfaces/jobResult'
import { Firebase, NotificationRequest, Slack, Webhook } from './interfaces/notificationRequest'
import axios from 'axios'

export class TransformationEndpoint {
  keycloak?: Keycloak

  transformationService: TransformationService

  constructor (transformationService: TransformationService, app: Application, keycloak?: Keycloak) {
    this.keycloak = keycloak
    this.transformationService = transformationService

    /**
     * @swagger
     * /:
     *   get:
     *     description: Simple Healthcheck
     *     responses:
     *       200:
     *         description: "I am alive!"
     *         schema:
     *           type: string
     */
    app.get('/', this.getHealthCheck)


    /**
     * @swagger
     * /version:
     *   get:
     *     description: Current API version
     *     responses:
     *       200:
     *         description: Returns the current API version (semantic versioning).
     *         schema:
     *           type: string
     */
    app.get('/version', this.getVersion)

    /**
     * @swagger
     * /job:
     *   post:
     *     description: Execute a transformation job
     *     consumes:
     *       - application/json
     *     parameters:
     *       - in: body
     *         name: transformationConfig
     *         schema:
     *           $ref: '#/definitions/TransformationRequest'
     *     responses:
     *       200:
     *         description: The transformed data.
     *         schema:
     *           $ref: '#/definitions/JobResult'
     *       400:
     *         description: if data or dataLocation not given or if transformation function is malformed or runtime errors
     */
    app.post('/job', this.determineAuth(), this.postJob)

    /**
     * @swagger
     * /notification/webhook:
     *   post:
     *     description: Execute a notification job with a webhook
     *     consumes:
     *       - application/json
     *     parameters:
     *       - in: body
     *         name: webhookConfig
     *         schema:
     *           $ref: '#/definitions/WebhookConfig'
     *     responses:
     *       200:
     *         description: If the notification was sent successfully.
     *       400:
     *         description: if webhook configuration was malformed
     */
    app.post('/notification/webhook', this.determineAuth(), this.postWebhook)

    /**
     * @swagger
     * /notification/slack:
     *   post:
     *     description: Execute a notification job with posting to slack
     *     consumes:
     *       - application/json
     *     parameters:
     *       - in: body
     *         name: slackConfig
     *         schema:
     *           $ref: '#/definitions/SlackConfig'
     *     responses:
     *       200:
     *         description: If the notification was sent successfully.
     *       400:
     *         description: if slack configuration was malformed
     */
    app.post('/notification/slack', this.determineAuth(), this.postSlack)


    /**
     * @swagger
     * /notification/fcm:
     *   post:
     *     description: Execute a notification job with Firebase Cloud Messaging (e.g push to mobile devices)
     *     consumes:
     *       - application/json
     *     parameters:
     *       - in: body
     *         name: firebaseConfig
     *         schema:
     *           $ref: '#/definitions/FirebaseConfig'
     *     responses:
     *       200:
     *         description: If the notification was sent successfully.
     *       400:
     *         description: if firebase configuration was malformed
     */
    app.post('/notification/fcm', this.determineAuth(), this.postFirebase)
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

  postJob = async (req: Request, res: Response): Promise<void> => {
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
