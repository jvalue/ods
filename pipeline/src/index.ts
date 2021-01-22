import { Server } from 'http'

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'

import { PipelineExecutionEndpoint } from './api/rest/pipelineExecutionEndpoint'
import VM2SandboxExecutor from './pipeline-execution/sandbox/vm2SandboxExecutor'
import PipelineExecutor from './pipeline-execution/pipelineExecutor'
import { PipelineConfigEndpoint } from './api/rest/pipelineConfigEndpoint'
import { PipelineConfigManager } from './pipeline-config/pipelineConfigManager'
import PostgresPipelineConfigRepository from './pipeline-config/postgresPipelineConfigRepository'
import { PipelineConfigConsumer } from './api/amqp/pipelineConfigConsumer'
import { AmqpEventPublisher } from './pipeline-config/publisher/amqpEventPublisher'

const port = 8080
let server: Server | undefined

process.on('SIGTERM', () => {
  console.info('Tramsformation-Service: SIGTERM signal received.')
  server?.close()
})

async function main (): Promise<void> {
  const sandboxExecutor = new VM2SandboxExecutor()
  const pipelineExecutor = new PipelineExecutor(sandboxExecutor)
  const eventPublisher = new AmqpEventPublisher()

  const pipelineConfigRepository = new PostgresPipelineConfigRepository()
  await pipelineConfigRepository.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  await eventPublisher.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  const pipelineConfigManager = new PipelineConfigManager(
    pipelineConfigRepository,
    pipelineExecutor,
    eventPublisher
  )

  const pipelineConfigConsumer = new PipelineConfigConsumer(pipelineConfigManager)
  await pipelineConfigConsumer.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  const pipelineExecutionEndpoint = new PipelineExecutionEndpoint(pipelineExecutor)
  const pipelineConfigEndpoint = new PipelineConfigEndpoint(pipelineConfigManager)

  const app = express()
  app.use(cors())
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: false }))

  pipelineExecutionEndpoint.registerRoutes(app)
  pipelineConfigEndpoint.registerRoutes(app)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200)
      .send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200)
      .send(pipelineExecutor.getVersion())
  })

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start pipeline service: ${error}`)
  })
