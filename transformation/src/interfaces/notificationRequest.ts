/**
   * @swagger
   * definitions:
   *   NotificationRequest:
   *     type: object
   *     required:
   *       - pipelineId
   *       - pipelineName
   *       - data
   *       - dataLocation
   *       - condition
   *       - type
   *     properties:
   *       pipelineId:
   *         description: Id of the pipeline.
   *         type: number
   *       pipelineName:
   *         description: Name of the pipeline
   *         type: string
   *       data:
   *         description: Data that the confition is tested against
   *         type: object
   *       dataLocation:
   *         type: string
   *         description: URL to the data to test condition on. Either data or dataLocation has to be present.
   *       condition:
   *         type: string
   *         description: JavaScript condition that is evaluated on the data. Execution of notification only if confition is true.
   *       type:
   *         type: string
   *         description: Type of the notification.
   */
function swaggerDummyNotificationRequest() { } // transpilation needs function to copy swagger annotation to dist directory
export interface NotificationRequest {
  pipelineId: number;
  pipelineName: string;
  data: object;
  dataLocation: string;
  condition: string;
  type: string;
}

/**
   * @swagger
   * definitions:
   *   WebhookConfig:
   *     allOf:
   *       - $ref: '#/definitions/NotificationRequest'
   *       - type: object
   *         required:
   *           - url
   *         properties:
   *           url:
   *             description: URL to push notification to.
   *             type: string
   */
function swaggerDummyWebhookNotificationRequest() { } // transpilation needs function to copy swagger annotation to dist directory
export interface Webhook extends NotificationRequest{
  url: string;
}

/**
   * @swagger
   * definitions:
   *   SlackConfig:
   *     allOf:
   *       - $ref: '#/definitions/NotificationRequest'
   *       - type: object
   *         required:
   *           - workspaceId
   *           - channelId
   *           - secret
   *         properties:
   *           workspaceId:
   *             description: Slack workspace id.
   *             type: string
   *           channelId:
   *             description: Slack channel id.
   *             type: string
   *           secret:
   *             description: Slack secret.
   *             type: string
   */
function swaggerDummySlackNotificationRequest() { } // transpilation needs function to copy swagger annotation to dist directory
export interface Slack extends NotificationRequest {
  workspaceId: string;
  channelId: string;
  secret: string;
}

/**
   * @swagger
   * definitions:
   *   FirebaseConfig:
   *     allOf:
   *       - $ref: '#/definitions/NotificationRequest'
   *       - type: object
   *         required:
   *           - projectId
   *           - clientEmail
   *           - privateKey
   *           - topic
   *         properties:
   *           projectId:
   *             description: Firebase project id.
   *             type: string
   *           clientEmail:
   *             description: The client email adress.
   *             type: string
   *           privateKey:
   *             description: The firebase secret.
   *             type: string
   *           topic:
   *             description: Topic to be published under.
   *             type: string
   */
function swaggerDummyFirebaseNotificationRequest() { } // transpilation needs function to copy swagger annotation to dist directory
export interface Firebase extends NotificationRequest{
  projectId: string;
  clientEmail: string;
  privateKey: string;
  topic: string;
}
