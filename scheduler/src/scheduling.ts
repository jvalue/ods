import type { AxiosError } from 'axios'
import deepEqual from 'deep-equal'
import schedule from 'node-schedule'

import * as AdapterClient from './api/http/adapter-client'
import type DatasourceConfig from './api/datasource-config'

import { sleep } from './sleep'
import { DatasourceConfigEvent } from './api/amqp/datasourceConfigConsumer'

export default class Scheduler {
  constructor (private readonly triggerRetries: number) {
  }

  private readonly allJobs: Map<number, SchedulingJob> = new Map() // datasourceId -> job

  async initializeJobsWithRetry (retries: number, backoff: number): Promise<void> {
    for (let i = 1; i <= retries; i++) {
      try {
        await this.initializeJobs()
        return
      } catch (e) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
          console.warn(`Failed to sync with Adapter Service on init (${retries}) . Retrying after ${backoff}ms... `)
        } else {
          console.warn(e)
          console.warn(`Retrying (${retries})...`)
        }
        await sleep(backoff)
      }
    }
    throw new Error('Failed to initialize datasource/pipeline scheduler.')
  }

  async initializeJobs (): Promise<void> {
    console.log('Starting scheduler initialization')
    const datasources: DatasourceConfig[] = await AdapterClient.getAllDatasources()
    console.log(`Received ${datasources.length} datasources from adapter-service`)
    for (const datasource of datasources) {
      datasource.trigger.firstExecution = new Date(datasource.trigger.firstExecution)
      await this.upsertJob(datasource) // assuming adapter service checks for duplicates
    }
  }

  applyDeleteEvent (event: DatasourceConfigEvent): void {
    this.cancelJob(event.datasource.id)
    this.allJobs.delete(event.datasource.id)
  }

  async applyCreateOrUpdateEvent (event: DatasourceConfigEvent): Promise<void> {
    const datasource = event.datasource
    datasource.trigger.firstExecution = new Date(event.datasource.trigger.firstExecution)
    await this.upsertJob(datasource)
  }

  getJob (datasourceId: number): SchedulingJob | undefined {
    return this.allJobs.get(datasourceId)
  }

  removeJob (datasourceId: number): void {
    this.allJobs.delete(datasourceId)
  }

  existsJob (datasourceId: number): boolean {
    return this.allJobs.has(datasourceId)
  }

  existsEqualJob (datasourceConfig: DatasourceConfig): boolean {
    const job = this.getJob(datasourceConfig.id)
    return job !== undefined && deepEqual(job.datasourceConfig, datasourceConfig)
  }

  determineExecutionDate (datasourceConfig: DatasourceConfig): Date {
    let executionDate = datasourceConfig.trigger.firstExecution.getTime()
    const now = Date.now()

    if (executionDate > now) {
      return datasourceConfig.trigger.firstExecution
    }

    const offset = (now - executionDate) % datasourceConfig.trigger.interval
    executionDate = now + datasourceConfig.trigger.interval - offset
    return new Date(executionDate)
  }

  scheduleDatasource (datasourceConfig: DatasourceConfig): SchedulingJob {
    const executionDate: Date = this.determineExecutionDate(datasourceConfig)
    console.log(`datasource ${datasourceConfig.id} with consecutive pipelines scheduled
      for next execution at ${executionDate.toLocaleString()}.`)

    const datasourceId = datasourceConfig.id

    const scheduledJob = schedule.scheduleJob(`Datasource ${datasourceId}`, executionDate, () => {
      this.execute(datasourceConfig)
        .catch(error => console.log('Failed to execute job:', error))
    })
    const datasourceJob = { scheduleJob: scheduledJob, datasourceConfig: datasourceConfig }
    this.allJobs.set(datasourceId, datasourceJob)

    return datasourceJob
  }

  reschedule (datasourceConfig: DatasourceConfig): void {
    if (datasourceConfig.trigger.periodic) {
      this.scheduleDatasource(datasourceConfig)
    } else {
      console.log(`Datasource ${datasourceConfig.id} is not periodic. Removing it from scheduling.`)
      this.removeJob(datasourceConfig.id)
      console.log(`Successfully removed datasource ${datasourceConfig.id} from scheduling.`)
    }
  }

  async execute (datasourceConfig: DatasourceConfig): Promise<void> {
    const datasourceId = datasourceConfig.id
    for (let i = 0; i < this.triggerRetries; i++) {
      try {
        await AdapterClient.triggerDatasource(datasourceId)
        console.log(`Datasource ${datasourceId} triggered.`)
        break
      } catch (error) {
        if (isAxiosError(error)) {
          handleAxiosError(error)
        }
        if (i === this.triggerRetries - 1) { // last retry
          console.error(`Could not trigger datasource ${datasourceId}`)
          break
        }
        console.info(`Triggering datasource failed - retrying (${i}/${this.triggerRetries})`)
      }
    }
    this.reschedule(datasourceConfig)
  }

  async upsertJob (datasourceConfig: DatasourceConfig): Promise<SchedulingJob> {
    const isNewDatasource = !this.existsJob(datasourceConfig.id)
    const datasourceState = isNewDatasource ? 'New' : 'Updated'

    console.log(`[${datasourceState}] datasource detected with id ${datasourceConfig.id}.`)

    if (!isNewDatasource) {
      this.cancelJob(datasourceConfig.id)
    }

    return this.scheduleDatasource(datasourceConfig)
  }

  getAllJobs (): SchedulingJob[] {
    return Array.from(this.allJobs.values())
  }

  cancelAllJobs (): void {
    this.allJobs.forEach(job => {
      schedule.cancelJob(job.scheduleJob)
    })
    this.allJobs.clear()
  }

  cancelJob (jobId: number): void {
    const job = this.allJobs.get(jobId)
    job?.scheduleJob.cancel()
  }
}

const isAxiosError = function (error: any): error is AxiosError {
  return error.isAxiosError
}

const handleAxiosError = function (error: AxiosError): void {
  const baseMsg = 'Error during datasource triggering:'

  if (error.response !== undefined) {
    console.error(`${baseMsg} ${error.response.status}: ${error.response.data}`)
    return
  }

  if (error.request !== undefined) {
    console.error(`${baseMsg} ${JSON.stringify(error.request)}`)
    return
  }

  console.error(`${baseMsg} unknown reason.`)
}

interface SchedulingJob {
  scheduleJob: schedule.Job
  datasourceConfig: DatasourceConfig
}
