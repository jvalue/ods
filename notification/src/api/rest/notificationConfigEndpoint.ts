import express from 'express'

import {
  isValidNotificationConfig,
  NotificationConfig
} from '../../notification-config/notificationConfig'
import { NotificationRepository } from '../../notification-config/notificationRepository'

export class NotificationConfigEndpoint {
  constructor (private readonly storageHandler: NotificationRepository) {}

  registerRoutes = (app: express.Application): void => {
    app.post('/configs', this.handleConfigCreation)
    app.put('/configs/:id', this.handleConfigUpdate)
    app.delete('/configs/:id', this.handleConfigDeletion)
    app.get('/configs/:id', this.handleConfigRetrieve)
    app.get('/configs', this.handleAllConfigRetrieve)
  }

  /**
   * Gets all Configs corresponding to Pipeline-ID
   * (identified by param id) as json list
   */
  handleConfigsByPipelineRetrieve = async (req: express.Request, res: express.Response): Promise<void> => {
    const pipelineId = parseInt(String(req.query.pipelineId))
    if (isNaN(pipelineId)) {
      res.status(400).send('Pipeline id is not set.')
      return
    }

    // Get configs from database
    const configs = await this.storageHandler.getForPipeline(pipelineId)
    res.status(200).send(configs)
  }

  handleAllConfigRetrieve = async (req: express.Request, res: express.Response): Promise<void> => {
    if (req.query.pipelineId !== undefined) {
      return await this.handleConfigsByPipelineRetrieve(req, res)
    }

    const configs = await this.storageHandler.getAll()
    res.status(200).send(configs)
  }

  /**
    * Gets config corresponding to id
    */
  handleConfigRetrieve = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).send('Notification id is not set.')
      return
    }

    try {
      const config = await this.storageHandler.getById(id)
      if (config === undefined) {
        res.status(404).send()
        return
      }
      res.status(200).send(config)
    } catch (e) {
      res.status(404).send(`Could not find config with id ${id}`)
    }
  }

  /**
   * Handles a request to save a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigCreation = async (req: express.Request, res: express.Response): Promise<void> => {
    const config: NotificationConfig = req.body

    if (!isValidNotificationConfig(config)) {
      res.status(400).send('Malformed notification request.')
      return
    }

    try {
      const savedConfig = await this.storageHandler.create(config)
      res.status(201).send(savedConfig)
    } catch (error) {
      console.error(`Could not create webhookConfig Object: ${error}`)
      res.status(500).send('Internal Server Error.')
    }
  }

  /**
   * Handles config  deletion requests.
   */
  handleConfigDeletion = async (req: express.Request, res: express.Response): Promise<void> => {
    const configId = parseInt(req.params.id)

    if (isNaN(configId)) {
      res.status(400).send('Config id is not set.')
      return
    }

    // Delete Config
    await this.storageHandler.delete(configId)
    res.status(200).send('DELETED')
  }

  /*
   * Handles a request to update a NotificationConfig
   * This is done by checking the validity of the config and then save
   * it to the database on success
   */
  handleConfigUpdate = async (req: express.Request, res: express.Response): Promise<void> => {
    const id = parseInt(req.params.id)
    const config = req.body

    if (isNaN(id)) {
      res.send(400).send('No valid id for notification config provided')
      return
    }

    if (!isValidNotificationConfig(config)) {
      res.status(400).send('Malformed notification config.')
      return
    }

    try {
      const updatedConfig: NotificationConfig = await this.storageHandler.update(id, config)
      res.status(200).send(updatedConfig)
    } catch (e) {
      res.status(404).send(`Could not find config with id ${id}`)
    }
  }
}
