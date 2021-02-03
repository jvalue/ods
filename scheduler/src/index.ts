import type { Server } from 'http'
import express from 'express'
import { AmqpConnection } from '@jvalue/node-dry-amqp'

import Scheduler from './scheduling'
import { setupInitialStateWithRetry } from './initializer'

import {
  AMQP_URL,
  CONNECTION_RETRIES,
  CONNECTION_BACKOFF_IN_MS,
  MAX_TRIGGER_RETRIES
} from './env'
import { DatasourceConfigConsumer } from './api/amqp/datasourceConfigConsumer'

process.on('SIGTERM', () => {
  console.info('Scheduler: SIGTERM signal received.')
  amqpConnection?.close().catch(() => {})
  scheduler?.removeAllJobs()
  server?.close()
})

function onAmqpConnectionLoss (error: any): never {
  console.log('Terminating because connection to AMQP lost:', error)
  process.exit(1)
}

const port = 8080
const API_VERSION = '0.0.1'

let server: Server | undefined
let scheduler: Scheduler | undefined
let amqpConnection: AmqpConnection | undefined

async function main (): Promise<void> {
  amqpConnection = new AmqpConnection(AMQP_URL, CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS, onAmqpConnectionLoss)
  scheduler = new Scheduler(MAX_TRIGGER_RETRIES)
  const datasourceConfigConsumer = new DatasourceConfigConsumer(amqpConnection, scheduler)
  await datasourceConfigConsumer.initialize()

  await setupInitialStateWithRetry(scheduler, CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

  await datasourceConfigConsumer.startEventConsumption()

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
    res.json(scheduler?.getAllJobs())
  })

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start scheduler: ${error}`)
  })
