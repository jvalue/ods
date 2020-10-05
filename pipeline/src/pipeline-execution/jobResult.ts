import Stats from './stats'
import JobError from './sandbox/jobError'

export type JobResult = SuccessJobResult | ErrorJobResult

export interface SuccessJobResult {
  data: unknown
  stats: Stats
}

export interface ErrorJobResult {
  error: JobError
  stats: Stats
}
