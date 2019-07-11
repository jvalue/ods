import deepEqual from 'deep-equal'
import PipelineJob from './pipeline-job'
import PipelineConfig from './pipeline-config'
import schedule from 'node-schedule'

import * as AdapterClient from './adapter-client'
import * as TransformationClient from './transformation-client'
import * as StorageClient from './storage-client'

const allJobs: Map<number, PipelineJob> = new Map() // pipelineId -> job

export function getPipielineJob (pipelineId: number): PipelineJob | undefined {
  return allJobs.get(pipelineId)
}

export function existsPipelineJob (pipelineId: number): boolean {
  return allJobs.has(pipelineId)
}

export function existsEqualPipelineJob (pipelineConfig: PipelineConfig): boolean {
  const pipelineJob = getPipielineJob(pipelineConfig.id)
  return pipelineJob !== undefined && deepEqual(pipelineJob.pipelineConfig, pipelineConfig)
}

export function determineExecutionDate (pipelineConfig: PipelineConfig): Date {
  let potentialExecutionDate: number = pipelineConfig.trigger.firstExecution.getTime()

  while (potentialExecutionDate < Date.now()) {
    potentialExecutionDate += pipelineConfig.trigger.interval
  }
  return new Date(potentialExecutionDate)
}

async function executePipeline (pipelineConfig: PipelineConfig) {
  console.log(`Execute Pipeline ${pipelineConfig.id}`)

  let retryNumber = 0;
  let pipelineSuccess = false;
  while(!pipelineSuccess && retryNumber <= 3) {
    if (retryNumber > 0) {
      await sleep(1000);
      console.log(`Starting retry ${retryNumber} of Pipeline ${pipelineConfig.id}`)
    }
    try {
      const importedData: any = await executeAdapter(pipelineConfig);
      const transformedData = await executeTransformations(pipelineConfig, importedData)
      executeStorage(pipelineConfig, transformedData)
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

async function executeAdapter (pipelineConfig: PipelineConfig): Promise<any> {
  console.log(`Execute Adapter for Pipeline ${pipelineConfig.id}`)
  try {
    const importedData = await AdapterClient.executeAdapter(pipelineConfig)
    console.log(`Sucessful import via Adapter for Pipeline ${pipelineConfig.id}`)
    return importedData
  } catch(e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.log(`Failed to import data via Adapter for Pipeline ${pipelineConfig.id}. Adapter Service not reachable`)
    } else {
      console.log(`Failed to import data via Adapter for Pipeline ${pipelineConfig.id}. Unknown error!`)
      console.error(e)
    }
    throw Error('Failed to import data via Adapter Service')
  }
}

async function executeTransformations (pipelineConfig: PipelineConfig, data: any): Promise<any> {
  console.log(`Execute Pipeline Transformation ${pipelineConfig.id}`)
  let lastPartialResult = data;

  try {
    for(const transformation of pipelineConfig.transformations) {
      const currentTransformation = JSON.parse(JSON.stringify(transformation)) // deeply copy object
      currentTransformation.data = lastPartialResult
      lastPartialResult = await TransformationClient.executeTransformation(currentTransformation)
    }
    console.log(`Sucessful transformed data for Pipeline ${pipelineConfig.id}`)
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

async function executeStorage (pipelineConfig: PipelineConfig, data: any) {
  console.log(`Execute Pipeline Storage ${pipelineConfig.id}`)
  try {
    const importedData = await StorageClient.executeStorage(pipelineConfig, data)
    console.log(`Sucessful stored Data for Pipeline ${pipelineConfig.id}`)
  } catch(e) {
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

  if (!isNewPipeline) {
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

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
