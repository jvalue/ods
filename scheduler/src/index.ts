import express from 'express'

import schedule from 'node-schedule'

import * as PipelineScheduling from './pipeline-scheduling'
import { CONFIG_SERVICE_URL } from './clients/core-client'

const app = express()
const port = 8080

const API_VERSION = '0.0.1'

const CHRONJOB_EVERY_2_SECONDS = '*/2 * * * * *'

const INITIAL_CONNECTION_RETRIES = parseInt(process.env.INITIAL_CONNECTION_RETRIES || '30')
const INITIAL_CONNECTION_RETRY_BACKOFF = parseInt(process.env.INITIAL_CONNECTION_RETRY_BACKOFF || '3000')

const server = app.listen(port, () => {
  console.log('listening on port ' + port)
})

app.get('/', (req, res) => {
  res.send('I am alive!')
})

app.get('/version', (req, res) => {
  res.header('Content-Type', 'text/plain')
  res.send(API_VERSION)
})
app.get('/jobs', (req, res) => {
  res.header('Content-Type', 'application/json')
  res.json(PipelineScheduling.getAllJobs())
})

let pipelineConfigPollingJob: schedule.Job

async function updatePipelines (): Promise<void> {
  try {
    return PipelineScheduling.updatePipelines()
  } catch (e) {
    return console.log(e)
  }
}

async function initPipelineJobs (): Promise<void> {
  console.log('Starting sync with Configuration Service on URL ' + CONFIG_SERVICE_URL)
  await PipelineScheduling.initializeJobs(INITIAL_CONNECTION_RETRIES, INITIAL_CONNECTION_RETRY_BACKOFF)
    .catch(() => {
      console.error('Scheduler: Initialization failed. Shutting down server...')
      server.close()
      process.exit()
    })

  pipelineConfigPollingJob = schedule.scheduleJob(
    'PipelineEventPollingJob',
    CHRONJOB_EVERY_2_SECONDS,
    updatePipelines)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
initPipelineJobs()

process.on('SIGTERM', async () => {
  console.info('Scheduler: SIGTERM signal received.')
  schedule.cancelJob(pipelineConfigPollingJob)
  PipelineScheduling.cancelAllJobs()
  await server.close()
})
