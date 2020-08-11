import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { StorageContentEndpoint } from './api/rest/StorageContentEndpoint'
import { PostgresStorageContentRepository } from './storage-content/postgresStorageContentRepository'
import { PostgresStorageStructureRepository } from './storage-structure/postgresStorageStructureRepository'
import { PipelineConfigConsumer } from './api/amqp/PipelineConfigConsumer'
import PipelineConfigEventHandler from './api/pipelineConfigEventHandler'
import PipelineExecutionEventHandler from './api/pipelineExecutionEventHandler'
import { PipelineExecutionConsumer } from './api/amqp/PipelineExecutionConsumer'
import { CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'

const port = 8080
const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

const storageContentRepository = new PostgresStorageContentRepository()
const storageStructureRepositry = new PostgresStorageStructureRepository()

const pipelineConfigEventHandler = new PipelineConfigEventHandler(storageStructureRepositry)
const pipelineExecutionEventHandler = new PipelineExecutionEventHandler(storageContentRepository)

const amqpPipelineConfigConsumer = new PipelineConfigConsumer(pipelineConfigEventHandler)
const amqpPipelineExecutionConsumer = new PipelineExecutionConsumer(pipelineExecutionEventHandler)

// global promise-rejected handler
process.on('unhandledRejection', function (reason, p) {
  console.debug('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason)
})

const server = app.listen(port, async () => {
  await storageContentRepository.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await storageStructureRepositry.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  await amqpPipelineConfigConsumer.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await amqpPipelineExecutionConsumer.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  console.log('Listening on port ' + port)

  const storageContentEndpoint = new StorageContentEndpoint(storageContentRepository, app)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200)
      .send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200)
      .send(storageContentEndpoint.getVersion())
    res.end()
  })
})

process.on('SIGTERM', async () => {
  console.info('Storage-MQ: SIGTERM signal received.')
  await server.close()
})
