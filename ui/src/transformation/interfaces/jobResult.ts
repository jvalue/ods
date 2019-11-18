import JobError from './jobError'

export default interface JobResult {
  data?: object;
  error?: JobError;
  stats: Stats;
}

interface Stats {
  durationInMilliSeconds: number;
  startTimestamp: number;
  endTimestamp: number;
}
