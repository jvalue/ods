import { Stats } from './stats'

export default interface JobResult {
  data?: object;
  error?: Error;
  stats: Stats;
}
