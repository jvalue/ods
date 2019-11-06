export default interface JobResult {
  data?: object;
  error?: Error;
  stats: Stats;
}

interface Stats {
  durationInMilliSeconds: number;
  startTimestamp: number;
  endTimestamp: number;
}
