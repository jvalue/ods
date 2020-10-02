import type schedule from 'node-schedule'
import type DatasourceConfig from './datasource-config'

export default interface SchedulingJob {
  scheduleJob: schedule.Job
  datasourceConfig: DatasourceConfig
}
