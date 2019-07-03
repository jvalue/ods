import deepEqual from 'deep-equal'
import PipelineJob from './pipeline-job'
import PipelineConfig from './pipeline-config'
import schedule from 'node-schedule'

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
  let potentialExecutionDate: number = pipelineConfig.trigger.firstExecution

  while (potentialExecutionDate < Date.now()) {
    potentialExecutionDate += pipelineConfig.trigger.interval
  }
  return new Date(potentialExecutionDate)
}

function executePipeline (pipelineConfig: PipelineConfig): void {
  console.log('Execute Pipeline ' + pipelineConfig.id)
  // TODO: implement

  if (pipelineConfig.trigger.periodic) {
    const nextExecutionDate = determineExecutionDate(pipelineConfig)
    console.log(
      'Scheduling next execution of Pipeline: ' + pipelineConfig.id + ' at ' + nextExecutionDate.toLocaleString()
    )
    schedulePipeline(pipelineConfig, nextExecutionDate)
  } else {
    console.log('Pipeline ' + pipelineConfig.id + ' is not periodic. Removing it from scheduling.')
    allJobs.delete(pipelineConfig.id)
  }
}

function schedulePipeline (pipelineConfig: PipelineConfig, executionDate: Date): PipelineJob {
  const pipelineId = pipelineConfig.id

  const scheduledJob = schedule.scheduleJob('Pipeline ' + pipelineId, executionDate, () =>
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
  Scheduled for next execution at ${executionDate.toLocaleString}`)

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
