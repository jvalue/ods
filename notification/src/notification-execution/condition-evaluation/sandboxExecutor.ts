export default interface SandboxExecutor {
  evaluate: (expression: string, data?: object) => boolean
}
