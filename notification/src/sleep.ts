/**
 * Returns a Promise that waits for a specific time period (in seconds) and resolves afterwards
 * @param ms Period to wait in seconds
 */
export function sleep (ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
