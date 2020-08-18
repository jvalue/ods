import express from 'express'

import schedule from 'node-schedule'

import * as Scheduling from './scheduling'

import {
  CONNECTION_RETRIES,
  CONNECTION_BACKOFF_IN_MS
}
  from './env'

const app = express()
const port = 8080

const API_VERSION = '0.0.1'

const CHRONJOB_EVERY_2_SECONDS = '*/2 * * * * *'

const server = app.listen(port, async () => {
  await initJobs(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)
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

// log all promise rejections that happen
// (mostly because they happen in async and don't log the point where it happened)
// For more information see https://nodejs.org/api/process.html#process_event_unhandledrejection
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  if (reason) {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason, ' reason code:', reason.code)
  } else {
    console.log('Unhandled Rejection at:', promise)
  }
})

process.on('SIGTERM', async () => {
  console.info('Scheduler: SIGTERM signal received.')
  schedule.cancelJob(datasourcePollingJob)
  schedule.cancelJob(pipelinePollingJob)
  Scheduling.cancelAllJobs()
  await server.close()
})
