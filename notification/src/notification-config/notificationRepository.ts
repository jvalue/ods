import { NotificationSummary } from "./notificationSummary";
import { FirebaseConfig, SlackConfig, WebHookConfig } from "./notificationConfig";

export interface NotificationRepository {
  init(retries: number, backoff: number):void
  getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary>
  deleteConfigsForPipelineID(pipelineId: number): void

  getSlackConfig(id: number): Promise<SlackConfig>
  getWebhookConfig(id: number): Promise<WebHookConfig>
  getFirebaseConfig(id: number): Promise<FirebaseConfig>

  saveWebhookConfig(webhookConfig: WebHookConfig): Promise<WebHookConfig>
  saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>
  saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>

  updateSlackConfig(id: number, slackConfig: SlackConfig): Promise<SlackConfig>
  updateWebhookConfig(id: number, webhookConfig: WebHookConfig): Promise<WebHookConfig>
  updateFirebaseConfig(id: number, firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>

  deleteSlackConfig(id: number): Promise<void>
  deleteWebhookConfig(id: number): Promise<void>
  deleteFirebaseConfig(id: number): Promise<void>
}
