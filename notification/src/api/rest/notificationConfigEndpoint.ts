
import * as express from 'express';
import { DeleteResult } from 'typeorm';

import { SlackConfig, WebHookConfig, NotificationConfig, FirebaseConfig, NotficationConfigRequest, CONFIG_TYPE } from '../../notification-config/notificationConfig';
import { NotificationRepository } from '../../notification-config/notificationRepository'

export class NotificationConfigEndpoint {

  storageHandler: NotificationRepository

  constructor(storageHandler: NotificationRepository, app: express.Application) {
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

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  /**
   * Gets all Configs asto corresponding to corresponnding Pipeline-ID
   * (identified by param id) as json list
   */
  handleConfigSummaryRequest = async (req: express.Request, res: express.Response) => {

    const pipelineId = parseInt(req.params.id)
    console.log(`Received request for configs with pipeline id ${pipelineId} from Host ${req.connection.remoteAddress}`)

    if (!pipelineId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      return
    }

    // Get configs from database
    const configSummary = await this.storageHandler.getConfigsForPipeline(pipelineId)
    res.status(200).send(configSummary)
  }

  /**
    * Gets all Slack Configs corresponding to corresponnding config id
    * (identified by param id) as json list
    */
  handleSlackRequest = async (req: express.Request, res: express.Response) => {

    const id = parseInt(req.params.id)
    console.log(`Received request for slack config with id ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error("Request for config: ID not set")
      res.status(400).send('Slack ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getSlackConfig(id)
      res.status(200).send(configs)
    } catch(e) {
      res.status(404).send(`Could not find firebase config with id ${id}`)
      res.end()
      return
    }
  }

  /**
   * Gets all Webhook Configs corresponding to corresponnding config id
   * (identified by param id) as json list
   */
  handleWebhookRequest = async (req: express.Request, res: express.Response) => {

    const id = parseInt(req.params.id)
    console.log(`Received request for webhook config with id ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error("Request for config: ID not set")
      res.status(400).send('Webhook ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getWebhookConfig(id)
      res.status(200).send(configs)
    } catch(e) {
      res.status(404).send(`Could not find webhook config with id ${id}`)
      res.end()
      return
    }
  }

  /**
   * Gets all Firebase Configs corresponding to corresponnding config id
   * (identified by param id) as json list
   */
  handleFCMRequest = async (req: express.Request, res: express.Response) => {

    const id = parseInt(req.params.id)
    console.log(`Received request for firebase config with id ${id} from Host ${req.connection.remoteAddress}`)

    if (!id) {
      console.error("Request for config: ID not set")
      res.status(400).send('Firebase ID is not set.')
      return
    }

    // Get config from database
    try {
      const configs = await this.storageHandler.getFirebaseConfig(id)
      res.status(200).send(configs)
    } catch(e) {
      res.status(404).send(`Could not find firebase config with id ${id}`)
      res.end()
      return
    }
  }

  /**
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigCreation  = async (req: express.Request, res: express.Response): Promise<void> => {
    console.log(`Received notification config from Host ${req.connection.remoteAddress}`)

    const notificationType = req.params.configType

    if (!notificationType) {
      console.error('No notification type provided')
      res.status(400).send('No notification type provided')
      res.end()
      return
    }

    const configRequest = req.body as NotificationConfig

    if (!NotificationConfigEndpoint.isValidNotificationConfig(configRequest)) {
      res.status(400).send('Malformed notification request.')
      return
    }

    switch(notificationType) {
      case CONFIG_TYPE.WEBHOOK:
        this.handleWebhookCreation(req, res)
        break
      case CONFIG_TYPE.FCM:
        this.handleFCMCreation(req, res)
        break
      case CONFIG_TYPE.SLACK:
        this.handleSlackCreation(req, res)
        break
      default:
        res.status(400).send(`Notification type ${notificationType} not suppoerted!`)
        return
    }
  }

  /**
   * Handles a request to save a WebhookConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleWebhookCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    console.log(`Received Webhook config from Host ${req.connection.remoteAddress}`)

    const webHookConfig = req.body as WebHookConfig
    let savedConfig: WebHookConfig

    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidWebhookConfig(webHookConfig)) {
      console.warn('Malformed webhook request.')
      res.status(400).send('Malformed webhook request.')
    }

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveWebhookConfig(webHookConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Internal Server Error.')
      return
    }

    // return saved post back
    res.status(200).send(savedConfig);
  }


  /**
   * Persists a posted Slack Config to the Database
   *
   * @param req Request for config creation
   * @param res Response for config creation
   */
  handleSlackCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    const slackConfig: SlackConfig = req.body as SlackConfig
    let savedConfig: SlackConfig

     // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidSlackConfig(slackConfig)) {
      console.warn('Malformed slack request.')
      res.status(400).send('Malformed slack request.')
      return
    }

    // Persist Config
    try {
      savedConfig = await this.storageHandler.saveSlackConfig(slackConfig)
    } catch(error) {
      console.error(`Could not create WebHookConfig Object: ${error}`)
      res.status(400).send('Malformed slack config request.')
      return

    }

    // return saved post back
    res.status(200).send(savedConfig);
  }

  /**
   * Persists a posted Firebase Config to the notifcation database service.
   */
  handleFCMCreation = async (req: express.Request, res: express.Response) => {
    console.log(`Received config from Host ${req.connection.remoteAddress}`)

    const firebaseConfig : FirebaseConfig = req.body as FirebaseConfig
    let savedConfig: FirebaseConfig


    // Check for validity of the request
    if (!NotificationConfigEndpoint.isValidFirebaseConfig(firebaseConfig)) {
      console.warn('Malformed FireBase request.')
      res.status(400).send('Malformed FireBase request.')
    }

    try {
      savedConfig = await this.storageHandler.saveFirebaseConfig(firebaseConfig)
    } catch (error) {
      console.error(`Could not create Firebase Object: ${error}`)
      res.status(400).send('Malformed firebase request.')
      return
    }

    // return saved post back
    res.status(200).send(savedConfig);
  }


  /**
   * Handles a requeset for config deletion.
   * Depending on the paramter :configType in the URL it either deletes a config
   * of a specific config type (such as slack) or deletes all configs
   * for a specific pipeline
   *
   * @param req request containing the paramter :configType and the :id of the config
   *            or respectively the pipeline id for the configs to be deleted
   *
   * @param res HTTP-Response that is sent back to the requester
   *
   */
  handleConfigDeletion = (req: express.Request, res: express.Response): void => {

    const configType = req.params.configType

    if (!configType) {
      console.warn(`Cannot delete Pipeline: Not valid config type provided`)
      res.status(400).send(`Cannot delete Pipeline: Not valid config type provided`)
      res.end()
      return
    }

    switch (configType) {
      case CONFIG_TYPE.WEBHOOK:
        this.deleteWebHook(req,res)
        break

      case CONFIG_TYPE.FCM:
        this.deleteFCM(req,res)
        break

      case CONFIG_TYPE.SLACK:
        this.deleteSlack(req,res)
        break

      case 'pipeline':
        this.handlePipelineDelete(req, res)

      default:
        res.status(400).send(`Notification type ${configType} not suppoerted!`)
        return
    }


  }

  /**
   * Handles a request for configs and returns the configs corresponding to the parameter :configType
   * as a HTTP- Response
   *
   * @param req Request for a Config.
   * @param res Response containing  specific configs, such as slack or  all configs for a pipeline
   */
  handleConfigRequest = (req: express.Request, res: express.Response): void => {

    const configType = req.params.configType

    if (!configType) {
      console.warn(`Cannot request config(s): Not valid config type provided`)
      res.status(400).send(`Cannot request config(s): Not valid config type provided`)
      res.end()
      return
    }

    switch (configType) {
      case CONFIG_TYPE.WEBHOOK:
        this.handleWebhookRequest(req, res)
        break

      case CONFIG_TYPE.FCM:
        this.handleFCMRequest(req, res)
        break

      case CONFIG_TYPE.SLACK:
        this.handleSlackRequest(req, res)
        break

      case 'pipeline':
        this.handleConfigSummaryRequest(req, res)
        break

      default:
        res.status(400).send(`Notification type ${configType} not suppoerted!`)
        return
    }

  }

  handlePipelineDelete = (req: express.Request, res: express.Response): void => {

    const pipelineId = parseInt(req.params.id)

    if (!pipelineId) {
      console.warn(`Cannot delete Pipeline: Not valid id provided`)
      res.status(400).send(`Cannot delete Pipeline: Not valid id provided`)
      res.end()
      return
    }

    console.log(`Received config-deletion-request for pipline with id "${pipelineId}" from Host ${req.connection.remoteAddress}`)

    // Delete All Configs with given pipelineId
    try {
      this.storageHandler.deleteConfigsForPipelineID(pipelineId)
    } catch (error) {
      console.error(`Could not delete configs with pipelineID ${pipelineId}: ${error}`)
      res.status(400).send('Internal Server Error.')
      res.end()
      return
    }

    // return saved post back
    res.status(200).send('Configs have been deleted.');
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
    let deleteResult : DeleteResult

    console.log(`Received deletion request for slack config with id ${configId} from Host ${req.connection.remoteAddress}`)

    if (!configId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    await this.storageHandler.deleteSlackConfig(configId)
    res.status(200).send('DELETED');
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
    let deleteResult: DeleteResult

    console.log(`Received deletion request for firebase configs with id ${configId} from Host ${req.connection.remoteAddress}`)

    if (!configId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    await this.storageHandler.deleteFirebaseConfig(configId)
    res.status(200).send('DELETED');
    res.end()
  }


  /**
   * Handles Webhook deletion requests.
   *
   * @param req Deletion Request containing parameter id (id to be deleted)
   * @param res Response to the Deletion request
   */
  deleteWebHook = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)
    let deleteResult: DeleteResult

    console.log(`Received deletion request for webhook configs with id ${configId} from Host ${req.connection.remoteAddress}`)

    if (!configId) {
      console.error("Request for config: ID not set")
      res.status(400).send('Pipeline ID is not set.')
      res.end()
      return
    }

    // Delete Config
    await this.storageHandler.deleteWebhookConfig(configId)
    res.status(200).send('DELETED');
    res.end()
  }

  /*
   * Handles a request to update a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigUpdate  = async (req: express.Request, res: express.Response): Promise<void> => {
    console.log(`Received notification config update request from Host ${req.connection.remoteAddress}`)
    const configType = req.params.configType
    const id = parseInt(req.params.id)
    const config = req.body as NotificationConfig

    if (!id) {
      console.warn(`No valid id for Notification Update Request provided`)
      res.send(400).send(`No valid id for Notification Update Request provided`)
      res.end()
      return
    }

    if (!configType) {
      console.warn(`No valid notification Type for Notification Update Request provided`)
      res.send(400).send(`No valid id for Notification Update Request provided`)
      res.end()
      return
    }

    if (!NotificationConfigEndpoint.isValidNotificationConfig(config)) {
      console.error("Received malformed NoticationUpdate request")
      res.status(400).send('Malformed Notification config.')
      res.end()
      return
    }

    let updatedConfig: NotificationConfig
    switch (configType) {
      case 'webhook':
        updatedConfig = await this.storageHandler.updateWebhookConfig(id, req.body as WebHookConfig)
        break
      case 'fcm':
        updatedConfig = await this.storageHandler.updateFirebaseConfig(id, req.body as FirebaseConfig)
        break
      case 'slack':
        updatedConfig = await this.storageHandler.updateSlackConfig(id, req.body as SlackConfig)
        break
      default:
        res.status(400).send(`Notification type ${configType} not suppoerted!`)
        return
    }

    res.status(200).send(updatedConfig)
    res.end()
  }

  /**
   * Evaluates the validity of the WebHookConfig (provided by argument),
   * by checking for the field variables.
   *
   * @param conf WebHookConfig to be validated
   *
   * @returns true, if conf is a valid, false else
   */
  private static isValidWebhookConfig(conf: WebHookConfig): boolean {
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
  private static isValidSlackConfig(conf: SlackConfig): boolean {
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
  private static isValidFirebaseConfig(conf: FirebaseConfig): boolean {
      return this.isValidNotificationConfig(conf) && !!conf.clientEmail && !!conf.privateKey || !conf.projectId || !conf.topic
  }


  /**
  * Evaluates the validity of the NotificationConfig (provided by argument),
  * by checking for the field variables.
  *
  * @param conf NotificationConfig to be validated
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
  * @param conf NotificationConfigRequest to be validated
  *
  * @returns true, if conf is a valid, false else
  */
  private static isValidNotificationConfigRequest(obj: NotficationConfigRequest): boolean {
    return !!obj.pipelineId && !!obj.condition && !!obj.type
  }
}
