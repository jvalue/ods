export default interface JobResult {
  data?: object;
  error?: Error;
  stats: Stats;
}

interface Stats {
  executionTime: number;
}
