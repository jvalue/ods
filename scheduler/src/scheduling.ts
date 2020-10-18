import type { AxiosError } from 'axios'
import deepEqual from 'deep-equal'
import schedule from 'node-schedule'

import * as AdapterClient from './clients/adapter-client'
import type ExecutionJob from './interfaces/scheduling-job'
import type DatasourceConfig from './interfaces/datasource-config'

import { sleep } from './sleep'
import { MAX_TRIGGER_RETRIES } from './env'
import DatasourceConfigEvent from '@/interfaces/datasource-config-event'


export default class Scheduler {
  private readonly allJobs: Map<number, ExecutionJob> = new Map() // datasourceId -> job

  async initializeJobsWithRetry (retries: number, backoff: number): Promise<void> {
    for (let i = 1; i <= retries; i++) {
      try {
        await this.initializeJobs()
        return
      } catch (e) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
          console.error(`Failed to sync with Adapter Service on init (${retries}) . Retrying after ${backoff}ms... `)
        } else {
          console.error(e)
          console.error(`Retrying (${retries})...`)
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
    datasource.trigger.firstExecution = new Date(event.datasource.trigger.firstExecution)
    await this.upsertJob(datasource)
  }

  getJob (datasourceId: number): ExecutionJob | undefined {
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

  scheduleDatasource (datasourceConfig: DatasourceConfig): ExecutionJob {
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
    for (let i = 0; i < MAX_TRIGGER_RETRIES; i++) {
      try {
        await AdapterClient.triggerDatasource(datasourceId)
        console.log(`Datasource ${datasourceId} triggered.`)
      } catch (httpError) {
        if (this.isAxiosError(httpError)) {
          if (httpError.response !== undefined) {
            console.debug(`Adapter was reachable but triggering datasource failed:
         ${httpError.response.status}: ${httpError.response.data}`)
          } else if (httpError.request !== undefined) {
            console.debug(`Not able to reach adapter when triggering datasource ${datasourceId}: ${httpError.request}`)
          }
        } else {
          console.debug(`Triggering datasource ${datasourceId} failed:`, httpError.message)
        }
        if (i === MAX_TRIGGER_RETRIES - 1) { // last retry
          console.error(`Could not trigger datasource ${datasourceId}:`, httpError)
          break
        }
        console.info(`Triggering datasource failed - retrying (${i}/${MAX_TRIGGER_RETRIES})`)
      }
    }
    this.reschedule(datasourceConfig)
  }

  isAxiosError (error: any): error is AxiosError {
    return error.isAxiosError
  }

  async upsertJob (datasourceConfig: DatasourceConfig): Promise<ExecutionJob> {
    const isNewDatasource = !this.existsJob(datasourceConfig.id)
    const datasourceState = isNewDatasource ? 'New' : 'Updated'

    console.log(`[${datasourceState}] datasource detected with id ${datasourceConfig.id}.`)

    if (!isNewDatasource) {
      this.cancelJob(datasourceConfig.id)
    }

    return this.scheduleDatasource(datasourceConfig)
  }

  getAllJobs (): ExecutionJob[] {
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






