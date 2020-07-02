import express from 'express'

import schedule from 'node-schedule'

import * as Scheduling from './scheduling'
import { ADAPTER_SERVICE_URL } from './clients/adapter-client'
import { AmqpHandler } from './clients/amqpHandler'

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
  res.json(Scheduling.getAllJobs())
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



async function initJobs (): Promise<void> {
  console.log('Starting sync with Adapter Service on URL ' + ADAPTER_SERVICE_URL)
  await Scheduling.initializeJobs(INITIAL_CONNECTION_RETRIES, INITIAL_CONNECTION_RETRY_BACKOFF)
    .catch(() => {
      console.error('Scheduler: Initialization failed. Shutting down server...')
      server.close()
      process.exit()
    })

    await updateDatsources()
  // datasourcePollingJob = schedule.scheduleJob(
  //   'DatasourceEventPollingJob',
  //   CHRONJOB_EVERY_2_SECONDS,
  //   updateDatsources)
}



// log all promise rejections that happen (mostly because they happen in async and don't log the point where it happened)
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.log('Caught unhandled promise:', reason);
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
initJobs()

process.on('SIGTERM', async () => {
  console.info('Scheduler: SIGTERM signal received.')
  schedule.cancelJob(datasourcePollingJob)
  schedule.cancelJob(pipelinePollingJob)
  Scheduling.cancelAllJobs()
  await server.close()
})
