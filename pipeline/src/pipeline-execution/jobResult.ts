import JobError from './sandbox/jobError';
import Stats from './stats';

export type JobResult = SuccessJobResult | ErrorJobResult;

export interface SuccessJobResult {
  data: unknown;
  stats: Stats;
}

export interface ErrorJobResult {
  error: JobError;
  stats: Stats;
}
