import { NotificationSummary } from "./notificationSummary";
import { FirebaseConfig, SlackConfig, WebhookConfig } from "./notificationConfig";

export interface NotificationRepository {
  init(retries: number, backoff: number):void
  getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary>
  deleteConfigsForPipelineID(pipelineId: number): void

  getSlackConfig(id: number): Promise<SlackConfig>
  getWebhookConfig(id: number): Promise<WebhookConfig>
  getFirebaseConfig(id: number): Promise<FirebaseConfig>

  saveWebhookConfig(webhookConfig: WebhookConfig): Promise<WebhookConfig>
  saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>
  saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>

  updateSlackConfig(id: number, slackConfig: SlackConfig): Promise<SlackConfig>
  updateWebhookConfig(id: number, webhookConfig: WebhookConfig): Promise<WebhookConfig>
  updateFirebaseConfig(id: number, firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>

  deleteSlackConfig(id: number): Promise<void>
  deleteWebhookConfig(id: number): Promise<void>
  deleteFirebaseConfig(id: number): Promise<void>
}
