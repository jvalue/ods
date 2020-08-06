
import * as express from 'express'

import {
  SlackConfig,
  WebhookConfig,
  NotificationConfig,
  FirebaseConfig,
  NotificationConfigRequest,
  CONFIG_TYPE
} from '../../notification-config/notificationConfig'
import { NotificationRepository } from '../../notification-config/notificationRepository'

export class NotificationConfigEndpoint {
  storageHandler: NotificationRepository

  constructor (storageHandler: NotificationRepository, app: express.Application) {
    this.storageHandler = storageHandler

    // Create Configs
    app.post('/config/:configType', this.handleConfigCreation)

    // Update of Configs
    app.put('/config/:configType/:id', this.handleConfigUpdate)

    // Deletion of Configs
    app.delete('/config/:configType/:id', this.handleConfigDeletion)

    // Request Configs
    app.get('/config/:configType/:id', this.handleConfigRequest)

    // Summary for pipeline
    app.get('/config/pipeline/:id', this.handleConfigSummaryRequest)
  }

  /**
   * Gets all Configs corresponding to Pipeline-ID
   * (identified by param id) as json list
   */
  handleConfigSummaryRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const pipelineId = parseInt(req.params.id)
    console.log(`Received request for configs with pipeline id ${pipelineId} from Host ${req.connection.remoteAddress}`)

    if (!pipelineId) {
      console.error('Request for config: ID not set')
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Get configs from database
    const configSummary = await this.storageHandler.getConfigsForPipeline(pipelineId)
    res.status(200).send(configSummary)
  }

  /**
    * Gets all Slack Configs corresponding to config id
    * (identified by param id) as json list
    */
  handleSlackRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    console.log(`Received request for slack config with id ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error('Request for config: ID not set')
      res.status(400).send('Slack ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getSlackConfig(id)
      res.status(200).send(configs)
    } catch (e) {
      res.status(404).send(`Could not find slack config with id ${id}`)
      res.end()
    }
  }

  /**
   * Gets all Webhook Configs corresponding to config id
   * (identified by param id) as json list
   */
  handleWebhookRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    console.log(`Received request for webhook config with id ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error('Request for config: ID not set')
      res.status(400).send('webhook ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getWebhookConfig(id)
      res.status(200).send(configs)
    } catch (e) {
      res.status(404).send(`Could not find webhook config with id ${id}`)
      res.end()
    }
  }

  /**
   * Gets all Firebase Configs corresponding to config id
   * (identified by param id) as json list
   */
  handleFCMRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    console.log(`Received request for firebase config with id ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error('Request for config: ID not set')
      res.status(400).send('Firebase ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getFirebaseConfig(id)
      res.status(200).send(configs)
    } catch (e) {
      res.status(404).send(`Could not find firebase config with id ${id}`)
      res.end()
    }
  }

  /**
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    console.log(`Received request to create notification config from host ${req.connection.remoteAddress}`)

    const notificationType = req.params.configType
    if (!notificationType) {
      res.status(400).send('No notification type provided')
      res.end()
      return
    }

    const configRequest = req.body as NotificationConfig
    if (!NotificationConfigEndpoint.isValidNotificationConfig(configRequest)) {
      res.status(400).send('Malformed notification request.')
      return
    }

    switch (notificationType) {
      case CONFIG_TYPE.WEBHOOK:
        await this.handleWebhookCreation(req, res)
        break
      case CONFIG_TYPE.FCM:
        await this.handleFCMCreation(req, res)
        break
      case CONFIG_TYPE.SLACK:
        await this.handleSlackCreation(req, res)
        break
      default:
        res.status(400).send(`Notification type ${notificationType} not supported!`)
    }
  }

  /**
   * Handles a request to save a WebhookConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleWebhookCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    const webhookConfig = req.body as WebhookConfig
    let savedConfig: WebhookConfig

    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidWebhookConfig(webhookConfig)) {
      res.status(400).send('Malformed webhook request.')
    }
    console.log(`Creation of webhook config for pipeline ${webhookConfig.pipelineId} requested.`)

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveWebhookConfig(webhookConfig)
    } catch (error) {
      console.error(`Could not create webhookConfig Object: ${error}`)
      res.status(500).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(201).send(savedConfig)
  }

  /**
   * Persists a posted Slack Config to the Database
   *
   * @param req Request for config creation
   * @param res Response for config creation
   */
  handleSlackCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    const slackConfig: SlackConfig = req.body as SlackConfig
    let savedConfig: SlackConfig

    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidSlackConfig(slackConfig)) {
      res.status(400).send('Malformed slack request.')
      return
    }
    console.log(`Creation of webhook config for pipeline ${slackConfig.pipelineId} requested.`)

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveSlackConfig(slackConfig)
    } catch (error) {
      console.error(`Could not create slackConfig Object: ${error}`)
      res.status(500).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(201).send(savedConfig)
  }

  /**
   * Persists a posted Firebase Config to the notification database service.
   */
  handleFCMCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    const firebaseConfig: FirebaseConfig = req.body as FirebaseConfig
    let savedConfig: FirebaseConfig

    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidFirebaseConfig(firebaseConfig)) {
      res.status(400).send('Malformed firebase request.')
    }
    console.log(`Creation of webhook config for pipeline ${firebaseConfig.pipelineId} requested.`)

    try {
      savedConfig = await this.storageHandler.saveFirebaseConfig(firebaseConfig)
    } catch (error) {
      console.error(`Could not create firebase Object: ${error}`)
      res.status(500).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(201).send(savedConfig)
  }

  /**
   * Handles a request for config deletion.
   * Depending on the parameter :configType in the URL it either deletes a config
   * of a specific config type (such as slack) or deletes all configs
   * for a specific pipeline
   *
   * @param req request containing the parameter :configType and the :id of the config
   *            or respectively the pipeline id for the configs to be deleted
   *
   * @param res HTTP-Response that is sent back to the requester
   *
   */
  handleConfigDeletion = async (req: express.Request, res: express.Response): Promise<void> => {
    const configType = req.params.configType

    if (!configType) {
      console.warn('Cannot delete notification: Not valid config type provided')
      res.status(400).send('Cannot delete notification: Not valid config type provided')
      res.end()
      return
    }

    try {
      switch (configType) {
        case CONFIG_TYPE.WEBHOOK:
          await this.deleteWebhook(req, res)
          break
        case CONFIG_TYPE.FCM:
          await this.deleteFCM(req, res)
          break
        case CONFIG_TYPE.SLACK:
          await this.deleteSlack(req, res)
          break
        case 'pipeline':
          this.handlePipelineDelete(req, res)
          break
        default:
          res.status(400).send(`Notification type ${configType} not supported!`)
          return
      }
    } catch (e) {
      res.status(404).send('Config not found.')
    }
  }

  /**
   * Handles a request for configs and returns the configs corresponding to the parameter :configType
   * as a HTTP- Response
   *
   * @param req Request for a config.
   * @param res Response containing  specific configs, such as slack or  all configs for a pipeline
   */
  handleConfigRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const configType = req.params.configType

    if (!configType) {
      console.warn('Cannot request config(s): Not valid config type provided')
      res.status(400).send('Cannot request config(s): Not valid config type provided')
      res.end()
      return
    }

    switch (configType) {
      case CONFIG_TYPE.WEBHOOK:
        await this.handleWebhookRequest(req, res)
        break

      case CONFIG_TYPE.FCM:
        await this.handleFCMRequest(req, res)
        break

      case CONFIG_TYPE.SLACK:
        await this.handleSlackRequest(req, res)
        break

      case 'pipeline':
        await this.handleConfigSummaryRequest(req, res)
        break

      default:
        res.status(400).send(`Notification type ${configType} not suppoerted!`)
    }
  }

  handlePipelineDelete = (req: express.Request, res: express.Response): void => {
    const pipelineId = parseInt(req.params.id)

    if (!pipelineId) {
      console.warn('Cannot delete Pipeline: Not valid id provided')
      res.status(400).send('Cannot delete Pipeline: Not valid id provided')
      res.end()
      return
    }

    console.log(`Received config-deletion-request for pipeline with id "${pipelineId}"`)

    // Delete All Configs with given pipelineId
    try {
      this.storageHandler.deleteConfigsForPipelineID(pipelineId)
    } catch (error) {
      console.error(`Could not delete configs with pipelineID ${pipelineId}: ${error}`)
      res.status(500).send('Internal Server Error.')
      res.end()
      return
    }

    // return saved post back
    res.status(200).send('Configs have been deleted.')
    res.end()
  }

  /**
   * Handles slack config  deletion requests.
   *
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteSlack = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    console.log(`Received deletion request for slack config with id ${configId}`)

    if (!configId) {
      console.error('Request for config: ID not set')
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    await this.storageHandler.deleteSlackConfig(configId)
    res.status(200).send('DELETED')
    res.end()
  }

  /**
    * Handles Firebase config deletion requests.
    *
    * @param req Deletion Request containing parameter id (id to be deleted)
    * @param res Response to the Deletion request
    */
  deleteFCM = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    console.log(`Received deletion request for firebase configs with id ${configId}`)

    if (!configId) {
      console.error('Request for config: ID not set')
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    await this.storageHandler.deleteFirebaseConfig(configId)
    res.status(200).send('DELETED')
    res.end()
  }

  /**
   * Handles Webhook deletion requests.
   *
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteWebhook = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)

    console.log(`Received deletion request for webhook configs with id ${configId}`)

    if (!configId) {
      console.error('Request for config: ID not set')
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    await this.storageHandler.deleteWebhookConfig(configId)
    res.status(200).send('DELETED')
    res.end()
  }

  /*
   * Handles a request to update a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigUpdate = async (req: express.Request, res: express.Response): Promise<void> => {
    console.log(`Received notification config update request from Host ${req.connection.remoteAddress}`)
    const configType = req.params.configType
    const id = parseInt(req.params.id)
    const config = req.body as NotificationConfig

    if (!id) {
      console.warn('No valid id for notification update request provided')
      res.send(400).send('No valid id for notification update request provided')
      res.end()
      return
    }

    if (!configType) {
      console.warn('No valid notification Type for notification update request provided')
      res.send(400).send('No valid id for notification update request provided')
      res.end()
      return
    }

    if (!NotificationConfigEndpoint.isValidNotificationConfig(config)) {
      console.error('Received malformed notificationUpdate request')
      res.status(400).send('Malformed notification config.')
      res.end()
      return
    }

    let updatedConfig: NotificationConfig
    try {
      switch (configType) {
        case 'webhook':
          updatedConfig = await this.storageHandler.updateWebhookConfig(id, req.body as WebhookConfig)
          break
        case 'fcm':
          updatedConfig = await this.storageHandler.updateFirebaseConfig(id, req.body as FirebaseConfig)
          break
        case 'slack':
          updatedConfig = await this.storageHandler.updateSlackConfig(id, req.body as SlackConfig)
          break
        default:
          res.status(400).send(`Notification type ${configType} not supported!`)
          return
      }
      res.status(200).send(updatedConfig)
    } catch (e) {
      res.status(404).send(`Could not find ${configType} config with id ${id}`)
    }
  }

  /**
   * Evaluates the validity of the WebHookConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf WebHookConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidWebhookConfig (conf: WebhookConfig): boolean {
    return this.isValidNotificationConfig(conf) && !!conf.url
  }

  /**
   * Evaluates the validity of the SlackConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf SlackConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidSlackConfig (conf: SlackConfig): boolean {
    return this.isValidNotificationConfig(conf) && !!conf.channelId && !!conf.secret && !!conf.workspaceId
  }

  /**
   * Evaluates the validity of the FirebaseConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf FirebaseConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidFirebaseConfig (conf: FirebaseConfig): boolean {
    return (this.isValidNotificationConfig(conf) && !!conf.clientEmail && !!conf.privateKey) ||
      !conf.projectId ||
      !conf.topic
  }

  /**
  * Evaluates the validity of the NotificationConfig (provided by argument),
  * by checking for the field variables.
  *
  * @param obj NotificationConfig to be validated
  *
  * @returns true, if conf is a valid, false else
  */
  private static isValidNotificationConfig (obj: NotificationConfig): boolean {
    return !!obj.pipelineId && !!obj.condition
  }

  /**
  * Evaluates the validity of the NotificationConfigRequest (provided by argument),
  * by checking for the field variables.
  *
  * @param obj NotificationConfigRequest to be validated
  *
  * @returns true, if conf is a valid, false else
  */
  private static isValidNotificationConfigRequest (obj: NotificationConfigRequest): boolean {
    return !!obj.pipelineId && !!obj.condition && !!obj.type
  }
}
