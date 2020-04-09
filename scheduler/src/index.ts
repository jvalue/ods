import express from 'express'

import { enableSwagger } from './swagger'

import schedule from 'node-schedule'

import * as Scheduling from './scheduling'
import { ADAPTER_SERVICE_URL } from './clients/adapter-client'
import * as CoreClient from './clients/core-client'

const app = express()
const port = 8080

const API_VERSION = '0.0.1'

const CHRONJOB_EVERY_2_SECONDS = '*/2 * * * * *'

const INITIAL_CONNECTION_RETRIES = parseInt(process.env.INITIAL_CONNECTION_RETRIES || '30')
const INITIAL_CONNECTION_RETRY_BACKOFF = parseInt(process.env.INITIAL_CONNECTION_RETRY_BACKOFF || '3000')

const server = app.listen(port, () => {
  console.log('listening on port ' + port)
})

/**
   * @swagger
   * /:
   *   get:
   *     description: Alive ping
   *     responses:
   *       200:
   *         description: I am alive!
   *         schema:
   *           type: string
   */
app.get('/', (req, res) => {
  res.send('I am alive!')
})

/**
   * @swagger
   * /version:
   *   get:
   *     description: Current API version
   *     responses:
   *       200:
   *         description: Returns the current API version (semantic versioning).
   *         schema:
   *           type: string
   */
app.get('/version', (req, res) => {
  res.header('Content-Type', 'text/plain')
  res.send(API_VERSION)
})

/**
   * @swagger
   * /jobs:
   *   get:
   *     description: Currently scheduled jobs
   *     produces:
   *      - application/json
   *     responses:
   *       200:
   *         description: Scheduled jobs
   *         schema:
   *           type: array
   *           items:
   *             $ref: '#/definitions/SchedulingJob'
   */
app.get('/jobs', (req, res) => {
  res.header('Content-Type', 'application/json')
  res.json(Scheduling.getAllJobs())
})

enableSwagger(app)

let datasourcePollingJob: schedule.Job
let pipelinePollingJob: schedule.Job

async function updateDatsources (): Promise<void> {
  try {
    return Scheduling.updateDatasources()
  } catch (e) {
    return console.log(e)
  }
}

async function initJobs (): Promise<void> {
  console.log('Starting sync with Adapter Service on URL ' + ADAPTER_SERVICE_URL)
  await Scheduling.initializeJobs(INITIAL_CONNECTION_RETRIES, INITIAL_CONNECTION_RETRY_BACKOFF)
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
  console.log('Caught unhandled promise:', reason);
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
initPipelineConfigSync()
initJobs()

process.on('SIGTERM', async () => {
  console.info('Scheduler: SIGTERM signal received.')
  schedule.cancelJob(datasourcePollingJob)
  schedule.cancelJob(pipelinePollingJob)
  Scheduling.cancelAllJobs()
  await server.close()
})
