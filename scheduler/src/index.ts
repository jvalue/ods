import type { Server } from 'http'

import express from 'express'
import schedule from 'node-schedule'

import * as Scheduling from './scheduling'
import {
  CONNECTION_RETRIES,
  CONNECTION_BACKOFF_IN_MS
} from './env'

const port = 8080
const API_VERSION = '0.0.1'
const CHRONJOB_EVERY_2_SECONDS = '*/2 * * * * *'

let datasourcePollingJob: schedule.Job | undefined
let server: Server | undefined

async function main (): Promise<void> {
  await initJobs(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

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
    res.json(Scheduling.getAllJobs())
  })

  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`)
  })
}

main()
  .catch(error => {
    console.error(`Failed to start notification service: ${error}`)
  })

function updateDatasources (): void {
  Scheduling.updateDatasources()
    .catch(error => {
      console.log(error)
    })
}

async function initJobs (retries = 30, retryBackoff = 3000): Promise<void> {
  await Scheduling.initializeJobsWithRetry(retries, retryBackoff)

  datasourcePollingJob = schedule.scheduleJob(
    'DatasourceEventPollingJob',
    CHRONJOB_EVERY_2_SECONDS,
    updateDatasources)
}

process.on('SIGTERM', () => {
  console.info('Scheduler: SIGTERM signal received.')
  if (datasourcePollingJob !== undefined) {
    schedule.cancelJob(datasourcePollingJob)
  }
  Scheduling.cancelAllJobs()
  server?.close()
})
