import * as express from 'express'

import NotificationService from '@/notification-execution/notificationService'
import { Firebase, NotificationRequest, Slack, Webhook } from './notificationRequest'
import { CONFIG_TYPE } from '@/notification-config/notificationConfig'
import { TransformationEvent } from '@/notification-execution/condition-evaluation/transformationEvent'

export class NotificationExecutionEndpoint {

  notificationService: NotificationService

  constructor (NotificationService: NotificationService, app: express.Application) {
    this.notificationService = NotificationService

    app.get('/', this.getHealthCheck)
    app.get('/version', this.getVersion)
    app.post('/webhook', this.postWebhook)
    app.post('/slack', this.postSlack)
    app.post('/fcm', this.postFirebase)
  }


  // The following methods need arrow syntax because of javascript 'this' shenanigans

  getHealthCheck = (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  }

  getVersion = (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(this.notificationService.getVersion())
    res.end()
  }

  postWebhook = async (req: express.Request, res: express.Response): Promise<void> => {
    const webhookRequest = req.body as Webhook
    if (!NotificationExecutionEndpoint.isValidWebhookRequest(webhookRequest)) {
      res.status(400).send('Malformed webhook express.Request.')
    }
    await this.processNotificationRequest(webhookRequest, CONFIG_TYPE.WEBHOOK, res)
    await this.notificationService.handleNotification
  }

  postSlack = async (req: express.Request, res: express.Response): Promise<void> => {
    const slackRequest = req.body as Slack
    if (!NotificationExecutionEndpoint.isValidSlackRequest(slackRequest)) {
      res.status(400).send('Malformed webhook express.Request.')
    }
    await this.processNotificationRequest(slackRequest, CONFIG_TYPE.SLACK, res)
  }

  postFirebase = async (req: express.Request, res: express.Response): Promise<void> => {
    const firebaseRequest = req.body as Firebase
    if (!NotificationExecutionEndpoint.isValidFirebaseRequest(firebaseRequest)) {
      res.status(400).send('Malformed webhook express.Request.')
    }
    await this.processNotificationRequest(firebaseRequest, CONFIG_TYPE.FCM, res)
  }

  processNotificationRequest = async (notification: NotificationRequest, configType: CONFIG_TYPE, res: express.Response): Promise<void> => {
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
      await this.notificationService.handleNotification(notification, event, configType)
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
