import express from 'express'
import axios from 'axios'

import schedule from 'node-schedule'

import * as PipelineScheduling from './pipeline-scheduling'
import PipelineConfig from './pipeline-config'

const app = express()
const port = 8080

const API_VERSION = '0.0.1'
const CONFIG_SERVICE_URL = process.env.CONFIG_SERVICE_URL || 'http://localhost:8081'
const CONFIG_SERVICE_SYNC_URL = CONFIG_SERVICE_URL + '/pipelines'

const CHRONJOB_EVERY_2_SECONDS = '*/2 * * * * *'

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
  // TODO: think of how to expose scheduler-job info
  res.json(PipelineScheduling.getAllJobs())
})

// POLLING THREAD
console.log('Starting sync with Configuration Service on URL ' + CONFIG_SERVICE_SYNC_URL)
const pipelineConfigPollingJob: schedule.Job = schedule.scheduleJob(
  'PipelineConfigPollingJob',
  CHRONJOB_EVERY_2_SECONDS
  ,
  async () => {
    try {
      const response = await axios.get<PipelineConfig[]>(CONFIG_SERVICE_SYNC_URL)
      const pipelineConfigurations: PipelineConfig[] = response.data

      pipelineConfigurations.forEach(pipelineConfig => {
        pipelineConfig.trigger.firstExecution = new Date(pipelineConfig.trigger.firstExecution) // Otherwise it is a String
        if (!PipelineScheduling.existsEqualPipelineJob(pipelineConfig)) {
          PipelineScheduling.upsertPipelineJob(pipelineConfig)
        }
      })
    } catch (e) {
      if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        console.error('Failed to sync with Config Service.')
      } else {
        console.error(e)
      }
      // TODO: failure handling
    }
  }
)

process.on('SIGTERM', async () => {
  console.info('Scheduler: SIGTERM signal received.')
  schedule.cancelJob(pipelineConfigPollingJob)
  PipelineScheduling.cancelAllJobs()
  await server.close()
})
