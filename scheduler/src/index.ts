import type { Server } from 'http'
import express from 'express'
import * as Scheduling from './scheduling'
import {
  CONNECTION_RETRIES,
  CONNECTION_BACKOFF_IN_MS
} from './env'

process.on('SIGTERM', () => {
  console.info('Scheduler: SIGTERM signal received.')
  Scheduling.cancelAllJobs()
  server?.close()
})

const port = 8080
const API_VERSION = '0.0.1'

let server: Server | undefined

async function main (): Promise<void> {
  await Scheduling.initializeJobsWithRetry(CONNECTION_RETRIES, CONNECTION_BACKOFF_IN_MS)

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
