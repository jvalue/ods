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

const port = 8080

const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

const storageContentRepository = new PostgresStorageContentRepository()
const storageStructureRepositry = new PostgresStorageStructureRepository()

const pipelineConfigEventHandler = new PipelineConfigEventHandler(storageStructureRepositry)
const pipelineExecutionEventHandler = new PipelineExecutionEventHandler(storageContentRepository)

const notificationConfigEndpoint = new StorageContentEndpoint(storageContentRepository, app)
const amqpPipelineConfigConsumer = new PipelineConfigConsumer(pipelineConfigEventHandler)
const amqpPipelineExecutionConsumer = new PipelineExecutionConsumer(pipelineExecutionEventHandler)

app.listen(port, async () => {

  await amqpPipelineConfigConsumer.connect(30, 2000)
  await amqpPipelineExecutionConsumer.connect(30, 2000)

  console.log('Listening on port ' + port)

  app.get("/", (req: express.Request, res: express.Response): void => {
    res.status(200)
        .send('I am alive!')
  })

  app.get("/version", (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.status(200)
        .send(notificationConfigEndpoint.getVersion())
    res.end()
  })
})
