/**
 * Returns a Promise that waits for a specific time period (in milliseconds) and resolves afterwards
 * @param ms Period to wait in milliseconds
 */
export function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
