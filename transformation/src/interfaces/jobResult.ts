import Stats from '../pipeline-execution/stats'
import JobError from '@/pipeline-execution/sandbox/jobError'

export default interface JobResult {
  data?: object;
  error?: JobError;
  stats: Stats;
}
