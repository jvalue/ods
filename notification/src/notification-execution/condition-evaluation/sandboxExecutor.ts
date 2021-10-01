export default interface SandboxExecutor {
  evaluate: (expression: string, data?: Record<string, unknown>) => boolean;
}
