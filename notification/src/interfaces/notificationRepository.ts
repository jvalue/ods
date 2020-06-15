import { FirebaseConfig, SlackConfig, WebHookConfig } from "./notificationConfig";
import { NotificationSummary } from "./notificationSummary";

export interface NotificationRepository {
  initConnection(retries: number, backoff: number): Promise<void>
  getConfigsForPipeline(pipelineId: number): Promise<NotificationSummary>
  getSlackConfigs(pipelineId: number): Promise<SlackConfig[]>
  getWebHookConfigs(pipelineId: number): Promise<WebHookConfig[]>
  getFirebaseConfigs(pipelineId: number): Promise<FirebaseConfig[]>
  saveWebhookConfig(webhookConfig: WebHookConfig): Promise<WebHookConfig>
  saveSlackConfig(slackConfig: SlackConfig): Promise<SlackConfig>
  saveFirebaseConfig(firebaseConfig: FirebaseConfig): Promise<FirebaseConfig>
}
