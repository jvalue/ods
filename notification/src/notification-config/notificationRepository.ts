import { FirebaseConfig, SlackConfig, WebHookConfig } from "./notificationConfig";
import { NotificationSummary } from "./notificationSummary";
import { Connection, DeleteResult, UpdateResult } from 'typeorm';

export interface NotificationRepository {
  init(retries: number, backoff: number):void
  getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary>
  deleteConfigsForPipelineID(pipelineId: number): void

  getSlackConfigs(pipelineId: number): Promise<SlackConfig[]>
  getWebHookConfigs(pipelineId: number): Promise<WebHookConfig[]>
  getFirebaseConfigs(pipelineId: number): Promise<FirebaseConfig[]>

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
