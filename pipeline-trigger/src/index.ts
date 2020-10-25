import express from 'express'
import bodyParser from 'body-parser'
import { AmqpHandler } from './api/amqp/amqpHandler'
import { PipelineExecutor } from './pipeline-executor/pipeline-executor'
import { DataImportEndpoint } from './api/rest/dataImportEndpoint'

import {
  CONNECTION_RETRIES,
  CONNECTION_BACKOFF
} from './env'

const port = 8080

async function main (): Promise<void> {
  const pipelineExecutor = new PipelineExecutor()

  const amqpHandler = new AmqpHandler(pipelineExecutor)
  await amqpHandler.connect(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  const app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: false }))

  const dataImportEndpoint = new DataImportEndpoint(pipelineExecutor)
  dataImportEndpoint.registerRoutes(app)

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  })

  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(pipelineExecutor.version)
  })

  app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start pipeline-execution service: ${error}`)
  })
