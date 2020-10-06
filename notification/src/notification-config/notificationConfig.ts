import { hasProperty, isObject } from '@/validators'

export enum NotificationType {
  WEBHOOK = 'WEBHOOK',
  SLACK = 'SLACK',
  FCM = 'FCM'
}

export interface NotificationConfig {
  id: number
  pipelineId: number
  condition: string
  type: NotificationType
  parameter: NotificationParameter
}

export type NotificationParameter = SlackParameter | WebhookParameter | FirebaseParameter

export interface SlackParameter {
  workspaceId: string
  channelId: string
  secret: string
}

export interface WebhookParameter {
  url: string
}

export interface FirebaseParameter {
  projectId: string
  clientEmail: string
  privateKey: string
  topic: string
}

/**
 * Evaluates the validity of the NotificationConfig (provided by argument),
 * by checking for the field variables.
 * @param conf NotificationConfig to be validated
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
 * @param conf WebhookParameter to be validated
 * @returns true, if object is a valid, false else
 */
export const isValidWebhookParameter = (parameters: unknown): parameters is WebhookParameter => {
  return isObject(parameters) && hasProperty(parameters, 'url')
}

/**
 * Evaluates the validity of the SlackParameter (provided by argument),
 * by checking for the field variables.
 * @param conf SlackParameter to be validated
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
 * @param conf FirebaseParameter to be validated
 * @returns true, if object is a valid, false else
 */
export const isValidFirebaseParameter = (parameters: unknown): parameters is FirebaseParameter => {
  return isObject(parameters) &&
    hasProperty(parameters, 'clientEmail') &&
    hasProperty(parameters, 'privateKey') &&
    hasProperty(parameters, 'projectId') &&
    hasProperty(parameters, 'topic')
}
