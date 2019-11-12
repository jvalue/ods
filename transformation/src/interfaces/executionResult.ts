import JobError from './jobError'

export default interface ExecutionResult {
  error?: JobError;
  data?: object;
}
