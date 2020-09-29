import Stats from './stats'
import JobError from './sandbox/jobError'

export default interface JobResult {
  data?: object
  error?: JobError
  stats: Stats
}
