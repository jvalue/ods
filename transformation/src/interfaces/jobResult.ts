import Stats from './stats'
import JobError from './jobError'

export default interface JobResult {
  data?: object;
  error?: JobError;
  stats: Stats;
}
