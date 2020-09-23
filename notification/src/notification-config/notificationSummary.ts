import { WebhookConfig, SlackConfig, FirebaseConfig } from './notificationConfig'

/**
 * NotificationSummary will be returned upon a request for
 * configs for a specific pipeline id
 *
 * @field webhook   All WebHookConfigs for a specific pipeline id
 * @field slack     All SlackConfigs for a specific pipeline id
 * @field firebase  All FirebaseConfigs for a specific pipeline id
 */
export interface NotificationSummary {

  webhook: WebhookConfig[]

  slack: SlackConfig[]

  firebase: FirebaseConfig[]

}
