import ExecutionResult from './job/executionResult'

export default interface SandboxExecutor {
  execute(code: string, data: object): ExecutionResult;
}
