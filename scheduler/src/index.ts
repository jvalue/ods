import express from 'express'

import schedule from 'node-schedule'

import * as Scheduling from './scheduling'
import { ADAPTER_SERVICE_URL } from './clients/adapter-client'
import * as CoreClient from './clients/core-client'
import * as AmqpClient from './clients/amqp-client'

const app = express()
const port = 8080

const API_VERSION = '0.0.1'

const CHRONJOB_EVERY_2_SECONDS = '*/2 * * * * *'

const INITIAL_CONNECTION_RETRIES = parseInt(process.env.INITIAL_CONNECTION_RETRIES || '30')
const INITIAL_CONNECTION_RETRY_BACKOFF = parseInt(process.env.INITIAL_CONNECTION_RETRY_BACKOFF || '3000')

const server = app.listen(port, async () => {
  await initPipelineConfigSync(INITIAL_CONNECTION_RETRIES, INITIAL_CONNECTION_RETRY_BACKOFF)
  await initJobs(INITIAL_CONNECTION_RETRIES, INITIAL_CONNECTION_RETRY_BACKOFF)
  await AmqpClient.init(INITIAL_CONNECTION_RETRIES, INITIAL_CONNECTION_RETRY_BACKOFF)
  console.log('listening on port ' + port)

  app.get('/', (req, res) => {
    res.send('I am alive!')
  })

  app.get('/version', (req, res) => {
    res.header('Content-Type', 'text/plain')
    res.send(API_VERSION)
  })

  app.get('/jobs', (req, res) => {
    res.header('Content-Type', 'application/json')
    res.json(Scheduling.getAllJobs())
  })

})

let datasourcePollingJob: schedule.Job
let pipelinePollingJob: schedule.Job

async function updateDatsources (): Promise<void> {
  try {
    return Scheduling.updateDatasources()
  } catch (e) {
    return console.log(e)
  }
}

async function initJobs (retries = 30, retryBackoff = 3000): Promise<void> {
  console.log('Starting sync with Adapter Service on URL ' + ADAPTER_SERVICE_URL)
  await Scheduling.initializeJobs(retries, retryBackoff)
    .catch(() => {
      console.error('Scheduler: Initialization failed. Shutting down server...')
      server.close()
      process.exit()
    })

  datasourcePollingJob = schedule.scheduleJob(
    'DatasourceEventPollingJob',
    CHRONJOB_EVERY_2_SECONDS,
    updateDatsources)
}

async function initPipelineConfigSync (retries = 30, retryBackoff = 3000): Promise<void> {
  try {
    console.log('Starting sync with Core Service')
    await CoreClient.initSync()
  } catch (e) {
    if (retries === 0) {
      return Promise.reject(new Error('Failed to initialize pipelineConfig sync.'))
    }
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.error(`Failed to sync with Core Service on initialization (${retries}) . Retrying after ${retryBackoff}ms... `)
    } else {
      console.error(e)
      console.error(`Retrying (${retries})...`)
    }
    await new Promise(resolve => setTimeout(resolve, retryBackoff)) // sleep
    return await initPipelineConfigSync(retries - 1, retryBackoff)
  }

  pipelinePollingJob = schedule.scheduleJob(
    'PipelineConfigSyncJob',
    CHRONJOB_EVERY_2_SECONDS,
    CoreClient.sync)
}

// log all promise rejections that happen (mostly because they happen in async and don't log the point where it happened)
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  if (reason) {
    console.log('Caught unhandled rejection: ', reason.code);
  } else {
    console.log(`Caught undefined unhandled rejection`)
  }
});

process.on('SIGTERM', async () => {
  console.info('Scheduler: SIGTERM signal received.')
  schedule.cancelJob(datasourcePollingJob)
  schedule.cancelJob(pipelinePollingJob)
  Scheduling.cancelAllJobs()
  await server.close()
})
