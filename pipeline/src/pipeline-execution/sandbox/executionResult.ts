import JobError from './jobError';

export type ExecutionResult = SuccessExecutionResult | ErrorExecutionResult;

export interface SuccessExecutionResult {
  data: unknown;
}

export interface ErrorExecutionResult {
  error: JobError;
}
