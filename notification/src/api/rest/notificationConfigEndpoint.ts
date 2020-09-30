import express from 'express'

import {
  SlackConfig,
  WebhookConfig,
  NotificationConfig,
  FirebaseConfig,
  CONFIG_TYPE
} from '../../notification-config/notificationConfig'
import { NotificationRepository } from '../../notification-config/notificationRepository'
import { hasProperty, isObject } from '../../validators'

export class NotificationConfigEndpoint {
  constructor (private readonly storageHandler: NotificationRepository) {}

  registerRoutes = (app: express.Application): void => {
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
    if (isNaN(pipelineId)) {
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
    if (isNaN(id)) {
      res.status(400).send('Slack ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getSlackConfig(id)
      res.status(200).send(configs)
    } catch (e) {
      res.status(404).send(`Could not find slack config with id ${id}`)
    }
  }

  /**
   * Gets all Webhook Configs corresponding to config id
   * (identified by param id) as json list
   */
  handleWebhookRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).send('webhook ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getWebhookConfig(id)
      res.status(200).send(configs)
    } catch (e) {
      res.status(404).send(`Could not find webhook config with id ${id}`)
    }
  }

  /**
   * Gets all Firebase Configs corresponding to config id
   * (identified by param id) as json list
   */
  handleFCMRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).send('Firebase ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getFirebaseConfig(id)
      res.status(200).send(configs)
    } catch (e) {
      res.status(404).send(`Could not find firebase config with id ${id}`)
    }
  }

  /**
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    const notificationType = req.params.configType

    if (!NotificationConfigEndpoint.isValidNotificationConfig(req.body)) {
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
    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidWebhookConfig(req.body)) {
      res.status(400).send('Malformed webhook request.')
      return
    }

    try {
      const savedConfig = await this.storageHandler.saveWebhookConfig(req.body)
      res.status(201).send(savedConfig)
    } catch (error) {
      console.error(`Could not create webhookConfig Object: ${error}`)
      res.status(500).send('Internal Server Error.')
    }
  }

  /**
   * Persists a posted Slack Config to the Database
   *
   * @param req Request for config creation
   * @param res Response for config creation
   */
  handleSlackCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidSlackConfig(req.body)) {
      res.status(400).send('Malformed slack request.')
      return
    }

    try {
      const savedConfig = await this.storageHandler.saveSlackConfig(req.body)
      res.status(201).send(savedConfig)
    } catch (error) {
      console.error(`Could not create slackConfig Object: ${error}`)
      res.status(500).send('Internal Server Error.')
    }
  }

  /**
   * Persists a posted Firebase Config to the notification database service.
   */
  handleFCMCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidFirebaseConfig(req.body)) {
      res.status(400).send('Malformed firebase request.')
      return
    }

    try {
      const savedConfig = await this.storageHandler.saveFirebaseConfig(req.body)
      res.status(201).send(savedConfig)
    } catch (error) {
      console.error(`Could not create firebase Object: ${error}`)
      res.status(500).send('Internal Server Error.')
    }
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

    if (isNaN(pipelineId)) {
      res.status(400).send('Cannot delete Pipeline: Not valid id provided')
      return
    }

    // Delete All Configs with given pipelineId
    try {
      this.storageHandler.deleteConfigsForPipelineID(pipelineId)
      res.status(200).send('Configs have been deleted.')
    } catch (error) {
      console.error(`Could not delete configs with pipelineID ${pipelineId}: ${error}`)
      res.status(500).send('Internal Server Error.')
    }
  }

  /**
   * Handles slack config  deletion requests.
   *
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteSlack = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)

    if (isNaN(configId)) {
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Delete Config
    await this.storageHandler.deleteSlackConfig(configId)
    res.status(200).send('DELETED')
  }

  /**
    * Handles Firebase config deletion requests.
    *
    * @param req Deletion Request containing parameter id (id to be deleted)
    * @param res Response to the Deletion request
    */
  deleteFCM = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)

    if (isNaN(configId)) {
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Delete Config
    await this.storageHandler.deleteFirebaseConfig(configId)
    res.status(200).send('DELETED')
  }

  /**
   * Handles Webhook deletion requests.
   *
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteWebhook = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)

    if (isNaN(configId)) {
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Delete Config
    await this.storageHandler.deleteWebhookConfig(configId)
    res.status(200).send('DELETED')
  }

  /*
   * Handles a request to update a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigUpdate = async (req: express.Request, res: express.Response): Promise<void> => {
    const configType = req.params.configType
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      res.send(400).send('No valid id for notification update request provided')
      return
    }

    if (!NotificationConfigEndpoint.isValidNotificationConfig(req.body)) {
      res.status(400).send('Malformed notification config.')
      return
    }

    let updatedConfig: NotificationConfig
    try {
      switch (configType) {
        case 'webhook':
          if (!NotificationConfigEndpoint.isValidWebhookConfig(req.body)) {
            res.status(400).send('Malformed webhook notification config.')
            return
          }
          updatedConfig = await this.storageHandler.updateWebhookConfig(id, req.body)
          break
        case 'fcm':
          if (!NotificationConfigEndpoint.isValidFirebaseConfig(req.body)) {
            res.status(400).send('Malformed firebase notification config.')
            return
          }
          updatedConfig = await this.storageHandler.updateFirebaseConfig(id, req.body)
          break
        case 'slack':
          if (!NotificationConfigEndpoint.isValidSlackConfig(req.body)) {
            res.status(400).send('Malformed slack notification config.')
            return
          }
          updatedConfig = await this.storageHandler.updateSlackConfig(id, req.body)
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
  private static isValidWebhookConfig (conf: unknown): conf is WebhookConfig {
    return this.isValidNotificationConfig(conf) && hasProperty(conf, 'url')
  }

  /**
   * Evaluates the validity of the SlackConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf SlackConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidSlackConfig (conf: unknown): conf is SlackConfig {
    return this.isValidNotificationConfig(conf) &&
      hasProperty(conf, 'channelId') &&
      hasProperty(conf, 'secret') &&
      hasProperty(conf, 'workspaceId')
  }

  /**
   * Evaluates the validity of the FirebaseConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf FirebaseConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidFirebaseConfig (conf: unknown): conf is FirebaseConfig {
    return this.isValidNotificationConfig(conf) &&
      hasProperty(conf, 'clientEmail') &&
      hasProperty(conf, 'privateKey') &&
      hasProperty(conf, 'projectId') &&
      hasProperty(conf, 'topic')
  }

  /**
  * Evaluates the validity of the NotificationConfig (provided by argument),
  * by checking for the field variables.
  *
  * @param obj NotificationConfig to be validated
  *
  * @returns true, if conf is a valid, false else
  */
  private static isValidNotificationConfig (obj: unknown): obj is NotificationConfig {
    return isObject(obj) && hasProperty(obj, 'pipelineId') && hasProperty(obj, 'condition')
  }
}
