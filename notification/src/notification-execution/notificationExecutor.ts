import axios from 'axios';
import * as firebase from 'firebase-admin';

import {
  FirebaseParameter,
  NotificationConfig,
  NotificationType,
  SlackParameter,
  WebhookParameter,
} from '../notification-config/notificationConfig';

import SandboxExecutor from './condition-evaluation/sandboxExecutor';
import FcmCallback from './notificationCallbacks/fcmCallback';
import SlackCallback from './notificationCallbacks/slackCallback';
import WebhookCallback from './notificationCallbacks/webhookCallback';

import App = firebase.app.App;

const VERSION = '0.0.1';

const SLACK_BASE_URL = process.env.SLACK_BASE_URL ?? 'https://hooks.slack.com/services';

export default class NotificationExecutor {
  executor: SandboxExecutor;

  constructor(executor: SandboxExecutor) {
    this.executor = executor;
  }

  getVersion(): string {
    return VERSION;
  }

  async execute(
    config: NotificationConfig,
    dataLocation: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const conditionHolds = this.executor.evaluate(config.condition, data);
    if (!conditionHolds) {
      // No need to trigger notification
      console.debug(`Notification ${config.id} for pipeline ${config.pipelineId} not sent: Condition does not hold`);
      return;
    }

    switch (config.type) {
      case NotificationType.WEBHOOK:
        await this.executeWebhook(config.parameter, dataLocation, message);
        return;
      case NotificationType.SLACK:
        await this.executeSlack(config.parameter, dataLocation, message);
        return;
      case NotificationType.FCM:
        await this.executeFCM(config.parameter, dataLocation, message);
    }
  }

  private async executeWebhook(
    configParameter: WebhookParameter,
    dataLocation: string,
    message: string,
  ): Promise<void> {
    const payload: WebhookCallback = {
      location: dataLocation,
      message: message,
      timestamp: new Date(Date.now()),
    };

    try {
      const response = await axios.post(configParameter.url, payload);
      console.debug(`Triggered notification (webhook) with status ${response.status} on ${configParameter.url}`);
    } catch (e: unknown) {
      console.info(`Notification (webhook) on ${configParameter.url} failed: ${JSON.stringify(e)}`);
    }
  }

  private async executeSlack(configParameter: SlackParameter, dataLocation: string, message: string): Promise<void> {
    const payload: SlackCallback = {
      text: message,
    };
    const url = `${SLACK_BASE_URL}/${configParameter.workspaceId}/${configParameter.channelId}/${configParameter.secret}`;

    try {
      const response = await axios.post(url, payload);
      console.debug(`Triggered notification (slack) with status ${response.status} on ${url}`);
    } catch (e: unknown) {
      console.info(`Notification (slack) on ${url} failed: ${JSON.stringify(e)}`);
    }
  }

  private async executeFCM(configParameter: FirebaseParameter, dataLocation: string, message: string): Promise<void> {
    let app: App;
    try {
      app = firebase.app(configParameter.clientEmail);
    } catch (e) {
      // App does not exist yet
      app = firebase.initializeApp(
        {
          credential: firebase.credential.cert({
            projectId: configParameter.projectId,
            clientEmail: configParameter.clientEmail,
            privateKey: configParameter.privateKey.replace(/\\n/g, '\n'),
          }),
          databaseURL: `https://${configParameter.projectId}.firebaseio.com`,
        },
        configParameter.clientEmail,
      );
    }
    const firebaseMessage: FcmCallback = {
      notification: {
        title: 'New Data Available',
        body: dataLocation,
      },
      data: {
        message: message,
      },
      topic: configParameter.topic,
    };

    try {
      await firebase.messaging(app).send(firebaseMessage);
      console.debug(`Triggered notification (firebase) successfully on project ${configParameter.projectId}`);
    } catch (e: unknown) {
      console.info(`Notification (firebase) on project ${configParameter.projectId} failed: ${JSON.stringify(e)}`);
    }
  }
}
