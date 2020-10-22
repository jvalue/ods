import { hasProperty, isObject } from '@ods/validators'

export enum NotificationType {
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
  FCM = 'FCM'
}

export interface NotificationBase {
  id: number
  pipelineId: number
  condition: string
}

export interface SlackNotification extends NotificationBase {
  type: NotificationType.SLACK
  parameter: SlackParameter
}

export interface SlackParameter {
  workspaceId: string
  channelId: string
  secret: string
}

export interface WebhookNotification extends NotificationBase {
  type: NotificationType.WEBHOOK
  parameter: WebhookParameter
}

export interface WebhookParameter {
  url: string
}

export interface FirebaseNotification extends NotificationBase {
  type: NotificationType.FCM
  parameter: FirebaseParameter
}

export interface FirebaseParameter {
  projectId: string
  clientEmail: string
  privateKey: string
  topic: string
}
export type NotificationParameter = SlackParameter | WebhookParameter | FirebaseParameter
export type NotificationConfig = SlackNotification | WebhookNotification | FirebaseNotification

/**
 * Evaluates the validity of the NotificationConfig (provided by argument),
 * by checking for the field variables.
 * @param config NotificationConfig to be validated
 * @returns true, if conf is a valid, false else
 */
export const isValidNotificationConfig = (config: unknown): config is NotificationConfig => {
  const baseIsValid = isObject(config) &&
    hasProperty(config, 'pipelineId') &&
    hasProperty(config, 'condition') &&
    hasProperty(config, 'type')
  if (!baseIsValid) {
    return false
  }
  const notificationConfig = config as NotificationConfig
  switch (notificationConfig.type) {
    case NotificationType.WEBHOOK:
      return isValidWebhookParameter(notificationConfig.parameter)
    case NotificationType.SLACK:
      return isValidSlackParameter(notificationConfig.parameter)
    case NotificationType.FCM:
      return isValidFirebaseParameter(notificationConfig.parameter)
    default:
      return false
  }
}

/**
 * Evaluates the validity of the WebhookParameter (provided by argument),
 * by checking for the field variables.
 * @param parameters WebhookParameter to be validated
 * @returns true, if object is a valid, false else
 */
export const isValidWebhookParameter = (parameters: unknown): parameters is WebhookParameter => {
  return isObject(parameters) && hasProperty(parameters, 'url')
}

/**
 * Evaluates the validity of the SlackParameter (provided by argument),
 * by checking for the field variables.
 * @param parameters SlackParameter to be validated
 * @returns true, if object is a valid, false else
 */
export const isValidSlackParameter = (parameters: unknown): parameters is SlackParameter => {
  return isObject(parameters) &&
    hasProperty(parameters, 'channelId') &&
    hasProperty(parameters, 'secret') &&
    hasProperty(parameters, 'workspaceId')
}

/**
 * Evaluates the validity of the FirebaseParameter (provided by argument),
 * by checking for the field variables.
 * @param parameters FirebaseParameter to be validated
 * @returns true, if object is a valid, false else
 */
export const isValidFirebaseParameter = (parameters: unknown): parameters is FirebaseParameter => {
  return isObject(parameters) &&
    hasProperty(parameters, 'clientEmail') &&
    hasProperty(parameters, 'privateKey') &&
    hasProperty(parameters, 'projectId') &&
    hasProperty(parameters, 'topic')
}
