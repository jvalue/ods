import express from 'express'
// import cors from 'cors'
import bodyParser from 'body-parser'
// import { AmqpHandler } from '@/api/amqp/amqpHandler'
import { PipelineExecutor } from './pipeline-executor/pipeline-executor'
import { DataImportEndpoint } from './api/rest/dataImportEndpoint'

const port = 8080

async function main (): Promise<void> {
  // const amqpHandler = new AmqpHandler(triggerEventHandler)
  // await amqpHandler.connect(CONNECTION_RETRIES, CONNECTION_BACKOFF)
  const app = express()
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: false }))

  const pipelineExecutor = new PipelineExecutor()

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
