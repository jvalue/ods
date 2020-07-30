import deepEqual from 'deep-equal'
import ExecutionJob from './interfaces/scheduling-job'
import schedule from 'node-schedule'

import * as AdapterClient from './clients/adapter-client'
import * as Scheduling from './scheduling'

import * as WorkflowExecution from './workflow-execution'
import DatasourceConfig from './interfaces/datasource-config'
import DatasourceEvent, { EventType } from './interfaces/datasource-event'

const allJobs: Map<number, ExecutionJob> = new Map() // datasourceId -> job
let currentEventId: number

/**
 * Initially receive all datasources from adapter service and start them up.
 */
export async function initializeJobs (retries = 30, retryBackoff = 3000): Promise<void> {
  try {
    console.log('Starting initialization scheduler')
    currentEventId = await AdapterClient.getLatestEventId()

    const datasources: DatasourceConfig[] = await AdapterClient.getAllDatasources()

    console.log(`Received ${datasources.length} datasources from adapter-service`)

    for (const datasource of datasources) {
      datasource.trigger.firstExecution = new Date(datasource.trigger.firstExecution)
      await Scheduling.upsertJob(datasource) // assuming adapter service checks for duplicates
    }
  } catch (e) {
    if (retries === 0) {
      return Promise.reject(new Error('Failed to initialize datasource/pipeline scheduler.'))
    }
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.error(`Failed to sync with Adapter Service on initialization (${retries}) . Retrying after ${retryBackoff}ms... `)
    } else {
      console.error(e)
      console.error(`Retrying (${retries})...`)
    }
    await sleep(retryBackoff)
    return initializeJobs(retries - 1, retryBackoff)
  }
}

/**
 * Regularly get deltas for pipeline configurations and apply changes.
 */
export async function updateDatasources (): Promise<void> {
  try {
    const nextEventId: number = await AdapterClient.getLatestEventId()

    const events: DatasourceEvent[] = await AdapterClient.getEventsAfter(currentEventId)
    if (events.length > 0) {
      console.log(`Applying ${events.length} updates from adapter service:`)
    }

    for (const event of events) {
      await applyChanges(event)
    }

    currentEventId = nextEventId
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.error('Failed to sync with adapter service on update.')
    } else {
      console.error('update failed')
    }
  }
}

async function applyChanges (event: DatasourceEvent): Promise<void> {
  console.log(event)
  switch (event.eventType) {
    case EventType.DATASOURCE_DELETE: {
      applyDeleteEvent(event)
      break
    }
    case EventType.DATASOURCE_CREATE:
    case EventType.DATASOURCE_UPDATE: {
      await applyCreateOrUpdateEvent(event)
      break
    }
    default: {
      console.error(`Received unknown event type: ${event.eventType}`)
      console.error(event)
      break
    }
  }
}

function applyDeleteEvent (event: DatasourceEvent): void {
  cancelJob(event.datasourceId)
  allJobs.delete(event.datasourceId)
}

async function applyCreateOrUpdateEvent (event: DatasourceEvent): Promise<void> {
  const datasource = await AdapterClient.getDatasource(event.datasourceId)
  datasource.trigger.firstExecution = new Date(datasource.trigger.firstExecution)
  await Scheduling.upsertJob(datasource)
}

export function getJob (datasourceId: number): ExecutionJob | undefined {
  return allJobs.get(datasourceId)
}

export function removeJob (datasourceId: number): void {
  allJobs.delete(datasourceId)
}

export function existsJob (datasourceId: number): boolean {
  return allJobs.has(datasourceId)
}

export function existsEqualJob (datasourceConfig: DatasourceConfig): boolean {
  const job = getJob(datasourceConfig.id)
  return job !== undefined && deepEqual(job.datasourceConfig, datasourceConfig)
}

export function determineExecutionDate (datasourceConfig: DatasourceConfig): Date {
  let executionDate = datasourceConfig.trigger.firstExecution.getTime()
  const now = Date.now()

  if (executionDate > now) {
    return datasourceConfig.trigger.firstExecution
  }

  const offset = (now - executionDate) % datasourceConfig.trigger.interval
  executionDate = now + datasourceConfig.trigger.interval - offset
  return new Date(executionDate)
}

export function scheduleDatasource (datasourceConfig: DatasourceConfig): ExecutionJob {
  const executionDate: Date = determineExecutionDate(datasourceConfig)
  console.log(`Datasource ${datasourceConfig.id} with consecuting pipelines scheduled for next execution at ${executionDate.toLocaleString()}.`)
  const datasourceId = datasourceConfig.id

  const scheduledJob = schedule.scheduleJob(`Datasource ${datasourceId}`, executionDate, () =>
    execute(datasourceConfig)
  )
  const datasourceJob = { scheduleJob: scheduledJob, datasourceConfig: datasourceConfig }
  allJobs.set(datasourceId, datasourceJob)

  return datasourceJob
}

async function execute(datasourceConfig: DatasourceConfig) {
  await WorkflowExecution.execute(datasourceConfig)

  if (datasourceConfig.trigger.periodic) {
    scheduleDatasource(datasourceConfig)
  } else {
    console.log(`Datasource ${datasourceConfig.id} is not periodic. Removing it from scheduling.`)
    removeJob(datasourceConfig.id)
    console.log(`Succesfully removed datasource ${datasourceConfig.id} from scheduling.`)
  }
}

export async function upsertJob (datasourceConfig: DatasourceConfig): Promise<ExecutionJob> {
  const isNewDatasource = !existsJob(datasourceConfig.id)
  const datasourceState = isNewDatasource ? 'New' : 'Updated'

  console.log(`[${datasourceState}] datasource detected with id ${datasourceConfig.id}.`)

  if (! isNewDatasource) {
    cancelJob(datasourceConfig.id)
  }

  return scheduleDatasource(datasourceConfig)
}

export function getAllJobs (): ExecutionJob[] {
  return Array.from(allJobs.values())
}

export function cancelAllJobs (): void {
  allJobs.forEach(job => {
    schedule.cancelJob(job.scheduleJob)
  })
  allJobs.clear()
}

export function cancelJob (jobId: number): void {
  const job = allJobs.get(jobId)
  if (job) {
    job.scheduleJob.cancel()
  }
}

function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
