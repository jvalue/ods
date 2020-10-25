import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import NotificationExecutor from './notification-execution/notificationExecutor'
import VM2SandboxExecutor from './notification-execution/condition-evaluation/vm2SandboxExecutor'
import { NotificationConfigEndpoint } from './api/rest/notificationConfigEndpoint'
import { NotificationExecutionEndpoint } from './api/rest/notificationExecutionEndpoint'
import { AmqpHandler } from './api/amqp/amqpHandler'
import { TriggerEventHandler } from './api/triggerEventHandler'
import { CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'
import { initNotificationRepository } from './notification-config/postgresNotificationRepository'

const port = 8080

async function main (): Promise<void> {
  const notificationRepository = await initNotificationRepository(CONNECTION_RETRIES, CONNECTION_RETRIES)
  const sandboxExecutor = new VM2SandboxExecutor()
  const notificationExecutor = new NotificationExecutor(sandboxExecutor)
  const triggerEventHandler = new TriggerEventHandler(notificationRepository, notificationExecutor)
  const notificationConfigEndpoint = new NotificationConfigEndpoint(notificationRepository)
  const notificationExecutionEndpoint = new NotificationExecutionEndpoint(triggerEventHandler)
  const amqpHandler = new AmqpHandler(triggerEventHandler)

  await amqpHandler.connect(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  const app = express()
  app.use(cors())
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: false }))

  notificationConfigEndpoint.registerRoutes(app)
  notificationExecutionEndpoint.registerRoutes(app)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(notificationExecutor.getVersion())
  })

  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start notification service: ${error}`)
  })
