import deepEqual from 'deep-equal'
import PipelineJob from './interfaces/pipeline-job'
import PipelineConfig from './interfaces/pipeline-config'
import PipelineEvent, { EventType } from './interfaces/pipeline-event'
import schedule from 'node-schedule'

import * as AdapterClient from './adapter-client'
import * as TransformationClient from './transformation-client'
import * as StorageClient from './storage-client'
import * as CoreClient from './core-client'
import * as PipelineScheduling from './pipeline-scheduling'

const allJobs: Map<number, PipelineJob> = new Map() // pipelineId -> job
var currentEventId: number

/**
 * Initially receive all pipelines from core service and start them up.
 */
export async function initializeJobs (retries: number = 30): Promise<void> {
  try {
    console.log('Starting initialization pipeline scheduler')
    currentEventId = await CoreClient.getLatestEventId()

    const pipelineConfigurations: PipelineConfig[] = await CoreClient.getAllPipelines()

    console.log(`Received ${pipelineConfigurations.length} pipelines from core-service`)

    pipelineConfigurations.forEach(pipelineConfig => {
      pipelineConfig.trigger.firstExecution = new Date(pipelineConfig.trigger.firstExecution)
      PipelineScheduling.upsertPipelineJob(pipelineConfig) // assuming core service checks for duplicates
    })
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
    await sleep(1000)
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

    Array.from(events).forEach(async event => applyChanges(event))

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
  switch (event.eventType) {
    case EventType.PIPELINE_DELETE: { applyDeleteEvent(event); break }
    case EventType.PIPELINE_CREATE:
    case EventType.PIPELINE_UPDATE: { applyCreateOrUpdateEvent(event); break }
  }
}

function applyDeleteEvent (event: PipelineEvent): void {
  cancelJob(event.pipelineId)
  allJobs.delete(event.pipelineId)
}

async function applyCreateOrUpdateEvent (event: PipelineEvent): Promise<void> {
  const pipeline = await CoreClient.getPipeline(event.pipelineId)
  pipeline.trigger.firstExecution = new Date(pipeline.trigger.firstExecution)
  PipelineScheduling.upsertPipelineJob(pipeline)
}

export function getPipelineJob (pipelineId: number): PipelineJob | undefined {
  return allJobs.get(pipelineId)
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

async function executePipeline (pipelineConfig: PipelineConfig): Promise<void> {
  console.log(`Execute Pipeline ${pipelineConfig.id}`)

  let retryNumber = 0
  let pipelineSuccess = false
  while (!pipelineSuccess && retryNumber <= 3) {
    if (retryNumber > 0) {
      await sleep(1000)
      console.log(`Starting retry ${retryNumber} of Pipeline ${pipelineConfig.id}`)
    }
    try {
      const importedData: object = await executeAdapter(pipelineConfig)
      const transformedData = await executeTransformations(pipelineConfig, importedData)
      await executeStorage(pipelineConfig, transformedData)
      pipelineSuccess = true
      console.log(`Successfully executed Pipeline ${pipelineConfig.id}`)
    } catch (e) {
      console.log(`Pipeline ${pipelineConfig.id} failed!`)
      retryNumber++
    }
  }

  if (pipelineConfig.trigger.periodic) {
    const nextExecutionDate = determineExecutionDate(pipelineConfig)
    console.log(`Scheduling next execution of Pipeline ${pipelineConfig.id} at ${nextExecutionDate.toLocaleString()}`)
    schedulePipeline(pipelineConfig, nextExecutionDate)
  } else {
    console.log(`Pipeline ${pipelineConfig.id}  is not periodic. Removing it from scheduling.`)
    allJobs.delete(pipelineConfig.id)
  }
}

async function executeAdapter (pipelineConfig: PipelineConfig): Promise<object> {
  console.log(`Execute Adapter for Pipeline ${pipelineConfig.id}`)
  try {
    const importedData = await AdapterClient.executeAdapter(pipelineConfig)
    console.log(`Sucessful import via Adapter for Pipeline ${pipelineConfig.id}`)
    return importedData
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to import data via Adapter for Pipeline ${pipelineConfig.id}. Adapter Service not reachable`)
    } else {
      console.log(`Failed to import data via Adapter for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to import data via Adapter Service')
  }
}

async function executeTransformations (pipelineConfig: PipelineConfig, data: object): Promise<object> {
  console.log(`Execute Pipeline Transformation ${pipelineConfig.id}`)
  let lastPartialResult = data

  try {
    for (const transformation of pipelineConfig.transformations) {
      const currentTransformation = JSON.parse(JSON.stringify(transformation)) // deeply copy object
      currentTransformation.data = lastPartialResult
      lastPartialResult = await TransformationClient.executeTransformation(currentTransformation)
    }
    console.log(`Sucessfully transformed data for Pipeline ${pipelineConfig.id}`)
    return lastPartialResult
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to transform data for Pipeline ${pipelineConfig.id}. Transformation Service not reachable`)
    } else {
      console.log(`Failed to transform data for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to transform data via Transformation Service')
  }
}

async function executeStorage (pipelineConfig: PipelineConfig, data: object): Promise<void> {
  try {
    await StorageClient.executeStorage(pipelineConfig, data)
    console.log(`Sucessfully stored Data for Pipeline ${pipelineConfig.id}`)
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to store Data for Pipeline ${pipelineConfig.id}. Storage Service not reachable`)
    } else {
      console.log(`Failed to store Data for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to store data via Storage Service')
  }
}

function schedulePipeline (pipelineConfig: PipelineConfig, executionDate: Date): PipelineJob {
  const pipelineId = pipelineConfig.id

  const scheduledJob = schedule.scheduleJob(`Pipeline ${pipelineId}`, executionDate, () =>
    executePipeline(pipelineConfig)
  )
  const pipelineJob = { scheduleJob: scheduledJob, pipelineConfig: pipelineConfig }
  allJobs.set(pipelineId, pipelineJob)

  return pipelineJob
}

export function upsertPipelineJob (pipelineConfig: PipelineConfig): PipelineJob {
  const executionDate: Date = determineExecutionDate(pipelineConfig)
  const isNewPipeline = !existsPipelineJob(pipelineConfig.id)
  const pipelineState = isNewPipeline ? 'New' : 'Updated'

  console.log(`[${pipelineState}] pipeline detected with id ${pipelineConfig.id}.
  Scheduled for next execution at ${executionDate.toLocaleString()}`)

  if (isNewPipeline) {
    StorageClient.createStructure(pipelineConfig.id)
  } else {
    cancelJob(pipelineConfig.id)
  }

  return schedulePipeline(pipelineConfig, executionDate)
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
