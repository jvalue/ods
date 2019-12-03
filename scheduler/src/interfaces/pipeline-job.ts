import schedule from 'node-schedule'
import PipelineConfig from './pipeline-config'

export default interface PipelineJob {
  scheduleJob: schedule.Job;
  pipelineConfig: PipelineConfig;
}
