import deepEqual from 'deep-equal'
import PipelineJob from './interfaces/core/pipeline-job'
import PipelineConfig from './interfaces/core/pipeline-config'
import PipelineEvent, { EventType } from './interfaces/core/pipeline-event'
import schedule from 'node-schedule'

import * as StorageClient from './clients/storage-client'
import * as CoreClient from './clients/core-client'
import * as PipelineScheduling from './pipeline-scheduling'

import { executePipeline } from './pipeline-execution'

const allJobs: Map<number, PipelineJob> = new Map() // pipelineId -> job
let currentEventId: number

/**
 * Initially receive all pipelines from core service and start them up.
 */
export async function initializeJobs (retries = 30): Promise<void> {
  try {
    console.log('Starting initialization pipeline scheduler')
    currentEventId = await CoreClient.getLatestEventId()

    const pipelineConfigurations: PipelineConfig[] = await CoreClient.getAllPipelines()

    console.log(`Received ${pipelineConfigurations.length} pipelines from core-service`)

    for (const pipelineConfig of pipelineConfigurations) {
      pipelineConfig.trigger.firstExecution = new Date(pipelineConfig.trigger.firstExecution)
      await PipelineScheduling.upsertPipelineJob(pipelineConfig) // assuming core service checks for duplicates
    }
  } catch (e) {
    if (retries === 0) {
      return Promise.reject(new Error('Failed to initialize pipeline scheduler.'))
    }
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.error(`Failed to sync with Config Service on initialization (${retries}) . Retrying ... `)
    } else {
      console.error(e)
      console.error(`Retrying (${retries})...`)
    }
    await sleep(3000)
    return initializeJobs(retries - 1)
  }
}

/**
 * Regularly get deltas for pipeline configurations and apply changes.
 */
export async function updatePipelines (): Promise<void> {
  try {
    const nextEventId: number = await CoreClient.getLatestEventId()

    const events: PipelineEvent[] = await CoreClient.getEventsAfter(currentEventId)
    if (events.length > 0) {
      console.log(`Applying ${events.length} updates from core service:`)
    }

    for (const event of events) {
      await applyChanges(event)
    }

    currentEventId = nextEventId
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.error('Failed to sync with config service on update.')
    } else {
      console.error('update failed')
      console.error(e)
    }
  }
}

async function applyChanges (event: PipelineEvent): Promise<void> {
  console.log(event)
  switch (event.eventType) {
    case EventType.PIPELINE_DELETE: {
      applyDeleteEvent(event)
      break
    }
    case EventType.PIPELINE_CREATE:
    case EventType.PIPELINE_UPDATE: {
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

function applyDeleteEvent (event: PipelineEvent): void {
  cancelJob(event.pipelineId)
  allJobs.delete(event.pipelineId)
}

async function applyCreateOrUpdateEvent (event: PipelineEvent): Promise<void> {
  const pipeline = await CoreClient.getPipeline(event.pipelineId)
  pipeline.trigger.firstExecution = new Date(pipeline.trigger.firstExecution)
  await PipelineScheduling.upsertPipelineJob(pipeline)
}

export function getPipelineJob (pipelineId: number): PipelineJob | undefined {
  return allJobs.get(pipelineId)
}

export function removePipelineJob (pipelineId: number): void {
  allJobs.delete(pipelineId)
}

export function existsPipelineJob (pipelineId: number): boolean {
  return allJobs.has(pipelineId)
}

export function existsEqualPipelineJob (pipelineConfig: PipelineConfig): boolean {
  const pipelineJob = getPipelineJob(pipelineConfig.id)
  return pipelineJob !== undefined && deepEqual(pipelineJob.pipelineConfig, pipelineConfig)
}

export function determineExecutionDate (pipelineConfig: PipelineConfig): Date {
  let executionDate = pipelineConfig.trigger.firstExecution.getTime()
  const now = Date.now()

  if (executionDate > now) {
    return pipelineConfig.trigger.firstExecution
  }

  const offset = (now - executionDate) % pipelineConfig.trigger.interval
  executionDate = now + pipelineConfig.trigger.interval - offset
  return new Date(executionDate)
}

export function schedulePipeline (pipelineConfig: PipelineConfig): PipelineJob {
  const executionDate: Date = determineExecutionDate(pipelineConfig)
  console.log(`Pipeline ${pipelineConfig.id} scheduled for next execution at ${executionDate.toLocaleString()}.`)
  const pipelineId = pipelineConfig.id

  const scheduledJob = schedule.scheduleJob(`Pipeline ${pipelineId}`, executionDate, () =>
    executePipeline(pipelineConfig)
  )
  const pipelineJob = { scheduleJob: scheduledJob, pipelineConfig: pipelineConfig }
  allJobs.set(pipelineId, pipelineJob)

  return pipelineJob
}

export async function upsertPipelineJob (pipelineConfig: PipelineConfig): Promise<PipelineJob> {
  const isNewPipeline = !existsPipelineJob(pipelineConfig.id)
  const pipelineState = isNewPipeline ? 'New' : 'Updated'

  console.log(`[${pipelineState}] pipeline detected with id ${pipelineConfig.id}.`)

  if (isNewPipeline) {
    await PipelineScheduling.createStorageStructure(pipelineConfig.id)
  } else {
    cancelJob(pipelineConfig.id)
  }

  return schedulePipeline(pipelineConfig)
}

export async function createStorageStructure (pipelineId: number, retries = 10): Promise<void> {
  try {
    console.log(`Creating storage structur for pipeline ${pipelineId}`)
    return await StorageClient.createStructure(pipelineId)
  } catch (e) {
    if (retries === 0) {
      return Promise.reject(new Error(`Could not create storage structure for pipeline ${pipelineId}.`))
    }
    if (e.code === '400') {
      console.log(e.message)
    }
    if (e.code === '404') {
      console.error(`Failed to communicate with Storage Service (${retries}) . Retrying ... `)
    } else {
      console.error(e)
      console.error(`Retrying (${retries})...`)
    }
    await sleep(1000)
    return createStorageStructure(retries - 1)
  }
}

export function getAllJobs (): PipelineJob[] {
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
