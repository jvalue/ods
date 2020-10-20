import type { Server } from 'http'
import express from 'express'
import Scheduler from './scheduling'

import {
  CONNECTION_RETRIES,
  CONNECTION_BACKOFF_IN_MS,
  MAX_TRIGGER_RETRIES
} from './env'
import { DatasourceConfigConsumer } from './api/amqp/datasourceConfigConsumer'

process.on('SIGTERM', () => {
  console.info('Scheduler: SIGTERM signal received.')
  scheduler.cancelAllJobs()
  server?.close()
})

const port = 8080
const API_VERSION = '0.0.1'

let server: Server | undefined
let scheduler: Scheduler

async function main (): Promise<void> {
  scheduler = new Scheduler(MAX_TRIGGER_RETRIES)
  const datasourceConfigConsumer = new DatasourceConfigConsumer(scheduler)

  await datasourceConfigConsumer.initialize(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)
  await scheduler.initializeJobsWithRetry(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

  const app = express()
  app.get('/', (req, res) => {
    res.send('I am alive!')
  })

  app.get('/version', (req, res) => {
    res.header('Content-Type', 'text/plain')
    res.send(API_VERSION)
  })

  app.get('/jobs', (req, res) => {
    res.header('Content-Type', 'application/json')
    res.json(scheduler.getAllJobs())
  })

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start scheduler: ${error}`)
  })
