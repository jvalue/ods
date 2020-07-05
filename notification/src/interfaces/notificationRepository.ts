import { FirebaseConfig, SlackConfig, WebHookConfig } from "../models/notificationConfig";
import { NotificationSummary } from "./notificationSummary";
import { Connection, DeleteResult, UpdateResult } from 'typeorm';

export interface NotificationRepository {
  init(retries: number, backoff: number):void
  getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary>
  deleteConfigsForPipelineID(pipelineId: number): Promise<void>

  getSlackConfigs(queryParams: object): Promise<SlackConfig[]>
  getWebHookConfigs(queryParams: object): Promise<WebHookConfig[]>
  getFirebaseConfigs(queryParams: object): Promise<FirebaseConfig[]>

  saveWebhookConfig(webhookConfig: WebHookConfig): Promise<WebHookConfig>
  saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>
  saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>

  updateSlackConfig(id: number, slackConfig: SlackConfig): Promise<UpdateResult>
  updateWebhookConfig(id: number, webhookConfig: WebHookConfig): Promise<UpdateResult>
  updateFirebaseConfig(id: number, firebaseConfig: FirebaseConfig): Promise<UpdateResult>

  deleteSlackConfig(id: number): Promise<DeleteResult>
  deleteWebhookConfig(id: number): Promise<DeleteResult>
  deleteFirebaseConfig(id: number): Promise<DeleteResult>
}
