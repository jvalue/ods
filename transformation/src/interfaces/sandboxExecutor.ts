import ExecutionResult from './executionResult'

export default interface SandboxExecutor {
  execute(code: string, data: object): ExecutionResult;
  evaluate(expression: string, data: object): boolean;
}
