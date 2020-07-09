import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import "reflect-metadata"; // once required for orm

import NotificationExecutor from './notification-execution/notificationExecutor'
import VM2SandboxExecutor from './notification-execution/condition-evaluation/vm2SandboxExecutor'
import { NotificationConfigEndpoint } from './api/rest/notificationConfigEndpoint';
import { NotificationExecutionEndpoint } from './api/rest/notificationExecutionEndpoint';
import { StorageHandler } from './notification-config/storageHandler';
import { AmqpHandler } from './api/amqp/amqpHandler';

const port = 8080

// authEnabled defaults to false
const authEnabled: boolean = process.env.AUTH_ENABLED === 'true'
if (authEnabled === false) {
  console.warn('WARNING: Authentication is disabled! Make sure this option turned off in production!\n')
}

const sandboxExecutor = new VM2SandboxExecutor()
const notificationService = new NotificationExecutor(sandboxExecutor)
const storageHandler = new StorageHandler()
const amqpHandler = new AmqpHandler(notificationService, storageHandler, sandboxExecutor)

const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

const notificationConfigEndpoint = new NotificationConfigEndpoint(storageHandler, app)
const notificationExecutionEndpoint = new NotificationExecutionEndpoint(notificationService, app)

app.listen(port, async () => {

  await storageHandler.init(30, 5)
  await amqpHandler.connect(30,5)

  console.log('listening on port ' + port)

  app.get("/", (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  })

  app.get("/version", (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(notificationService.getVersion())
    res.end()
  })
})
