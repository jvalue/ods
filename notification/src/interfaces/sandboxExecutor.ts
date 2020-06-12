export default interface SandboxExecutor {
  evaluate(expression: string, data: string): boolean;
}
