import { Server } from 'http'

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { StorageContentEndpoint } from './api/rest/storageContentEndpoint'
import { PostgresStorageContentRepository } from './storage-content/postgresStorageContentRepository'
import { PostgresStorageStructureRepository } from './storage-structure/postgresStorageStructureRepository'
import { PipelineConfigConsumer } from './api/amqp/pipelineConfigConsumer'
import PipelineConfigEventHandler from './api/pipelineConfigEventHandler'
import PipelineExecutionEventHandler from './api/pipelineExecutionEventHandler'
import { PipelineExecutionConsumer } from './api/amqp/pipelineExecutionConsumer'
import { CONNECTION_RETRIES, CONNECTION_BACKOFF } from './env'
import PostgresRepository from './util/postgresRepository'
import AmqpConsumer from './util/amqpConsumer'

const port = 8080
let server: Server | undefined

process.on('SIGTERM', () => {
  console.info('Storage-MQ: SIGTERM signal received.')
  server?.close()
})

async function main (): Promise<void> {
  const storageContentRepository = new PostgresStorageContentRepository(new PostgresRepository())
  const storageStructureRepository = new PostgresStorageStructureRepository(new PostgresRepository())

  const pipelineConfigEventHandler = new PipelineConfigEventHandler(storageStructureRepository)
  const pipelineExecutionEventHandler = new PipelineExecutionEventHandler(storageContentRepository)

  const amqpPipelineConfigConsumer = new PipelineConfigConsumer(pipelineConfigEventHandler, new AmqpConsumer())
  const amqpPipelineExecutionConsumer = new PipelineExecutionConsumer(pipelineExecutionEventHandler, new AmqpConsumer())

  await storageContentRepository.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await storageStructureRepository.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  await amqpPipelineConfigConsumer.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  await amqpPipelineExecutionConsumer.init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

  const storageContentEndpoint = new StorageContentEndpoint(storageContentRepository)

  const app = express()
  app.use(cors())
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: false }))

  storageContentEndpoint.registerRoutes(app)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200).send(storageContentEndpoint.getVersion())
  })

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start storage-mq service: ${error}`)
  })
