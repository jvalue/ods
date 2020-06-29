import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import "reflect-metadata"

import { Server } from 'http'

import { DataRepository } from './interfaces/dataRepository'
import { AmqpHandler } from './handlers/amqpHandler';

export class DataEndPoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  
  version = '0.0.1'

  storageHandler: DataRepository
  amqpHandler: AmqpHandler


  constructor(storageHandler: DataRepository, amqpHandler: AmqpHandler, port: number, auth: boolean) {
    this.port = port
    this.storageHandler = storageHandler
    this.amqpHandler = amqpHandler

    this.app = express()

    this.app.use(cors())
    this.app.use(bodyParser.json({ limit: '50mb' }))
    this.app.use(bodyParser.urlencoded({ extended: false }))

    this.store = undefined
    if (auth) {
      this.store = new session.MemoryStore()
      this.keycloak = new Keycloak({ store: this.store })
      this.app.use(this.keycloak.middleware())
    }

    this.app.get('/', this.getHealthCheck)
    this.app.get('/version', this.getVersion)

    // Request Configs
    this.app.get('/config/:configType/:id/', this.determineAuth(), this.handleDataRequest)

    this.storageHandler.init(5, 5)
    amqpHandler.connect(5,5)
  }


  listen (): Server {
    return this.app.listen(this.port, () => {
      console.log('listening on port ' + this.port)
    })
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  getHealthCheck = (req: Request, res: Response): void => {
    res.send('I am alive!')
  }

  getVersion = (req: Request, res: Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(this.version)
    res.end()
  }

  determineAuth = (): express.RequestHandler | [] => {
    if (this.keycloak !== undefined) {
      return this.keycloak.protect()
    } else {
      return []
    }
  }

  /**
   * Handles a request for data for id (corresponding to the parameter :id)
   * as a HTTP- Response
   * 
   * @param req Request for data.
   * @param res Response containing  the data identified by id :id 
   */
  handleDataRequest = async (req: Request, res: Response): Promise<void> => {

    const dataId = parseInt(req.params.id)

    if (!dataId || dataId < 1) {
      console.warn(`Cannot request data: No valid id provided`)
      res.status(400).send(`Cannot request data: No valid id provided`)
      res.end()
      return
    }

    const configs = await this.storageHandler.getData(dataId)

    if (!configs) {
      console.error(`Could not get slack config with id "${dataId}" from database`)
      res.status(500).send('Internal Server error.')
      res.end()
      return
    }

  }
}
