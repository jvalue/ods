import ExecutionResult from './jobResult/executionResult'

export default interface SandboxExecutor {
  execute(code: string, data: object): ExecutionResult;
}
