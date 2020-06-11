import bodyParser from 'body-parser'
import express, { Application, Request, Response } from 'express'
import session, { MemoryStore } from 'express-session'
import cors from 'cors'
import Keycloak from 'keycloak-connect'
import TransformationService from './interfaces/transformationService'
import TransformationRequest from './interfaces/transformationRequest'
import { Server } from 'http'
import JobResult from './interfaces/jobResult'
import axios from 'axios'

export class TransformationEndpoint {
  port: number
  app: Application
  store?: MemoryStore
  keycloak?: Keycloak

  transformationService: TransformationService

  constructor (transformationService: TransformationService, port: number, auth: boolean) {
    this.port = port
    this.transformationService = transformationService

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
    this.app.post('/job', this.determineAuth(), this.postJob)
  }

  listen (): Server {
    return this.app.listen(this.port, () => {
      console.log('listening on port ' + this.port)
      //  const amqp = require("amqplib/callback_api");
      //  const rabbit_url = process.env.RABBIT_SERVICE_URL;
      //  const rabbit_usr = process.env.RABBIT_SERVICE_USR;
      //  const rabbit_password = process.env.RABBIT_SERVICE_PWD;

      //  const rabit_amqp_url = "amqp://" + rabbit_usr + ":" + rabbit_password + "@" + rabbit_url;
      //  console.log("URL" + rabit_amqp_url);
      // amqp.connect(rabit_amqp_url, function (error0: string, connection) {
      //   if (error0) {
      //     console.error("Error connecting to RabbitMQ: " + error0);
      //     return -1;
      //   } else {
      //     console.log("Connected to RabbitMQ.")
      //     connection.createChannel(function (error1, channel) {
      //       if (error1) {
      //         console.error("RabbitMQ: " + error0);
      //         return -1
      //       }

      //       const queue = 'test_queue'
      //       const msg = 'Hello World'

      //       channel.assertQueue(queue, {
      //         durable: false,
      //       });


      //       channel.sendToQueue(queue, Buffer.from(msg));
      //       console.log(" [x] Sent %s", msg);

      //      });
      //   }
      //  });
      
    })
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  getHealthCheck = (req: Request, res: Response): void => {
    res.send('I am alive!')
  }

  getVersion = (req: Request, res: Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(this.transformationService.getVersion())
    res.end()
  }

  postJob = async (req: Request, res: Response): Promise<void> => {
    const transformation: TransformationRequest = req.body
    if (!transformation.data && !transformation.dataLocation) {
      res.writeHead(400)
      res.end()
      return
    } else if (transformation.dataLocation) {
      if (transformation.data) {
        console.log(`Data and dataLocation fields both present.
         Overwriting existing data with data from ${transformation.dataLocation}`)
      }
      console.log(`Fetching data from adapter, location: ${transformation.dataLocation}`)
      const importResponse = await axios.get(transformation.dataLocation)
      console.log('Fetching successful.')
      transformation.data = importResponse.data
    }
    if (!transformation.func) {
      transformation.func = 'return data;' // Undefined transformation functions are interpreted as identity function
    }
    const result: JobResult = this.transformationService.executeJob(transformation.func, transformation.data)
    const answer: string = JSON.stringify(result)
    res.setHeader('Content-Type', 'application/json')
    if (result.data) {
      res.writeHead(200)
    } else {
      res.writeHead(400)
    }
    res.write(answer)
    res.end()
  }

  determineAuth = (): express.RequestHandler | [] => {
    if (this.keycloak !== undefined) {
      return this.keycloak.protect()
    } else {
      return []
    }
  }


}
