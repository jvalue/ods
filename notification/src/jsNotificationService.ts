import App = firebase.app.App;
import axios from 'axios'
import * as firebase from 'firebase-admin'
import NotificationService from './interfaces/notificationService';

import { FirebaseConfigRequest, NotificationConfigRequest, SlackConfigRequest, WebHookConfigRequest, NotificationConfig, WebHookConfig, SlackConfig, FirebaseConfig } from './interfaces/notificationConfig';

import SlackCallback from './interfaces/slackCallback';
import WebhookCallback from './interfaces/webhookCallback';
import FcmCallback from './interfaces/fcmCallback';
import SandboxExecutor from './interfaces/sandboxExecutor';
import { TransformationEventInterface } from './interfaces/transformationEventInterface';


const VERSION = '0.0.1'

export default class JSNotificationService implements NotificationService {

  executor: SandboxExecutor

  constructor (executor: SandboxExecutor) {
    this.executor = executor
  }

  getVersion (): string {
      return VERSION
  }

async handleNotification(notification: NotificationConfig, event: TransformationEventInterface, type: string): Promise<void> {
  console.log(`NotificationRequest received for pipeline: ${notification.pipelineId}.`)

  
  const conditionHolds = this.executor.evaluate(notification.condition, event.jobResult.data)
  console.log('Condition is ' + conditionHolds)
  if (!conditionHolds) { // no need to trigger notification
    return Promise.resolve()
  }
  
  const message = this.buildMessage(event)

  switch (type) {
  case 'WEBHOOK':
      await this.handleWebhook(notification as WebHookConfig)
      break
  case 'FCM':
      await this.handleFCM(notification as FirebaseConfig, message)
      break
  case 'SLACK':
      await this.handleSlack(notification as SlackConfig, message)
      break
  default:
      throw new Error('Notification type not implemented.')
  }
  }


  /**
   * Builds the notification message to be sent,
   * by composing the contents of the transformation event to readable
   * message
   * 
   * @param event event to extract transformation results from 
   * @returns message to be sent as notification
   */
  private buildMessage(event: TransformationEventInterface) {
    
    var message: string
    const jobError = event.jobResult.error    // Error of transformation (if exists)

    /*====================================================
    *  Build Message for failed transformation/pipline
    *====================================================*/
    if (jobError) {
      message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineID})Failed.

        Details:
          Line: ${jobError.lineNumber}
          Message: ${jobError.message}
          Stacktrace: ${ jobError.stacktrace}`
    } else {
    /*======================================================
     *  Build Message for succesfull transformation/pipline
     *=======================================================*/ 
      // Build Stats (Time measures for transformation execution)
      const jobStats = event.jobResult.stats
      let start = new Date(jobStats.startTimestamp)
      let end = new Date(jobStats.endTimestamp)


      // Build Success Message
      message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineID}) ` +
        `has new data available. Fetch at ${event.dataLocation}.

      Transformation Details:
            Start: ${start}
            End:  ${end}
            Duration: ${jobStats.durationInMilliSeconds} ms`
    }
    return message
  }

  private async handleWebhook (webhook: WebHookConfig): Promise<void> {
    const callbackObject: WebhookCallback = {
      location: webhook.dataLocation,
      timestamp: new Date(Date.now())
    }
    console.log(`Posting webhook to ${webhook.url}, callback object: ${JSON.stringify(callbackObject)}.`)
    await axios.post(webhook.url, callbackObject)
  }

  private async handleSlack (slack: SlackConfig, message: string): Promise<void> {
    let slackBaseUri = 'https://hooks.slack.com/services'
    if (process.env.MOCK_RECEIVER_HOST && process.env.MOCK_RECEIVER_PORT) {
      slackBaseUri = `http://${process.env.MOCK_RECEIVER_HOST}:${process.env.MOCK_RECEIVER_PORT}/slack`
    }
    const callbackObject: SlackCallback = {
      text: message
    }
    const url = `${slackBaseUri}/${slack.workspaceId}/${slack.channelId}/${slack.secret}`
    console.log(`Posting slack notification to ${url}, callbackObject: ${JSON.stringify(callbackObject)}`)
    await axios.post(url, callbackObject)
  }

  private async handleFCM (firebaseRequest: FirebaseConfig, message: string): Promise<void> {
    let app: App
    try {
      app = firebase.app(firebaseRequest.clientEmail)
    } catch (e) { // app does not exist yet
      app = firebase.initializeApp({
        credential: firebase.credential.cert({
          projectId: firebaseRequest.projectId,
          clientEmail: firebaseRequest.clientEmail,
          privateKey: firebaseRequest.privateKey.replace(/\\n/g, '\n')
        }),
        databaseURL: `https://${firebaseRequest.projectId}.firebaseio.com`
      },
      firebaseRequest.clientEmail)
    }
    const firebaseMessage: FcmCallback = {
      notification: {
        title: 'New Data Available',
        body: message
      },
      data: {
        textfield: 'textvalue'
      },
      topic: firebaseRequest.topic
    }
    console.log(`Sending firebase message, callback object: ${JSON.stringify(firebaseMessage)}.`)
    const firebaseResponse = await firebase.messaging(app).send(firebaseMessage)
    console.log(`Firebase message sent to: ${firebaseResponse}`)
  }
}
