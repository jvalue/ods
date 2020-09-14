import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import 'reflect-metadata' // once required for orm

import NotificationExecutor from './notification-execution/notificationExecutor'
import VM2SandboxExecutor from './notification-execution/condition-evaluation/vm2SandboxExecutor'
import { NotificationConfigEndpoint } from './api/rest/notificationConfigEndpoint'
import { NotificationExecutionEndpoint } from './api/rest/notificationExecutionEndpoint'
import { StorageHandler } from './notification-config/storageHandler'
import { AmqpHandler } from './api/amqp/amqpHandler'
import { TriggerEventHandler } from './api/triggerEventHandler'
import { CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'

const port = 8080

const sandboxExecutor = new VM2SandboxExecutor()
const notificationExecutor = new NotificationExecutor(sandboxExecutor)
const storageHandler = new StorageHandler()
const triggerEventHandler = new TriggerEventHandler(storageHandler, notificationExecutor)
const amqpHandler = new AmqpHandler(triggerEventHandler)

const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notificationConfigEndpoint = new NotificationConfigEndpoint(storageHandler, app)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notificationExecutionEndpoint = new NotificationExecutionEndpoint(triggerEventHandler, app)

app.listen(port, async () => {
  await amqpHandler.connect(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await storageHandler.init(CONNECTION_RETRIES, CONNECTION_RETRIES)

  console.log('listening on port ' + port)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(notificationExecutor.getVersion())
    res.end()
  })
})
