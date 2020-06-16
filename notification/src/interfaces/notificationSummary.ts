import { WebHookConfig, SlackConfig, FirebaseConfig } from '../models/notificationConfig';


/**
 * NotificationSummary will be returned upon a request for
 * configs for a specfic Pipeline id
 * 
 * @field webhook   All WebHookConfigs for a specific pipeline id
 * @field slack     All SlackConfigs for a specific pipeline id
 * @field firebase  All FirebaseConfigs for a specific pipeline id
 */
export interface NotificationSummary{

    webhook: WebHookConfig[]

    slack: SlackConfig[]

    firebase: FirebaseConfig[]

}