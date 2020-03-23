import schedule from 'node-schedule'
import DatasourceConfig from './datasource-config'

export default interface SchedulingJob {
  scheduleJob: schedule.Job;
  datasourceConfig: DatasourceConfig;
}
