import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'

import { PipelineExecutionEndpoint } from './api/rest/pipelineExecutionEndpoint'
import VM2SandboxExecutor from './pipeline-execution/sandbox/vm2SandboxExecutor'
import PipelineExecutor from './pipeline-execution/pipelineExecutor'
import { PipelineConfigEndpoint } from './api/rest/pipelineConfigEndpoint'
import { PipelineConfigManager } from './pipeline-config/pipelineConfigManager'
import AmqpExecutionResultPublisher from './pipeline-config/publisher/amqpExecutionResultPublisher'
import PostgresPipelineConfigRepository from './pipeline-config/postgresPipelineConfigRepository'
import AmqpConfigWritesPublisher from './pipeline-config/publisher/amqpConfigWritesPublisher'
import { PipelineConfigConsumer } from './api/amqp/pipelineConfigConsumer'

const port = 8080
const app = express()
app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

const sandboxExecutor = new VM2SandboxExecutor()
const pipelineExecutor = new PipelineExecutor(sandboxExecutor)
const pipelineConfigRepository = new PostgresPipelineConfigRepository()
const executionResultPublisher = new AmqpExecutionResultPublisher()
const configWritesPublisher = new AmqpConfigWritesPublisher()

// global promise-rejected handler
process.on('unhandledRejection', function (reason, p) {
  console.debug('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})

const server = app.listen(port, async () => {
  console.log('Listening on port ' + port)

  await pipelineConfigRepository.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await executionResultPublisher.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await configWritesPublisher.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  const pipelineConfigManager = new PipelineConfigManager(
    pipelineConfigRepository,
    pipelineExecutor,
    configWritesPublisher,
    executionResultPublisher
  )

  const pipelineConfigConsumer = new PipelineConfigConsumer(pipelineConfigManager)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pipelineExecutionEndpoint = new PipelineExecutionEndpoint(pipelineExecutor, app)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pipelineConfigEndpoint = new PipelineConfigEndpoint(pipelineConfigManager, app)

  await pipelineConfigConsumer.connect(30, 2000)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200)
      .send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200)
      .send(pipelineExecutor.getVersion())
    res.end()
  })
})

process.on('SIGTERM', async () => {
  console.info('Tramsformation-Service: SIGTERM signal received.')
  await server.close()
})
