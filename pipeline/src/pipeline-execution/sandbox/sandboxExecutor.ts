import { ExecutionResult } from './executionResult';

export default interface SandboxExecutor {
  // Fix @typescript-eslint/ban-types for object type
  execute: (code: string, data: Record<string, unknown>) => ExecutionResult;
}
