/**
 * Returns a Promise that waits for a specific time period (in milliseconds) and resolves afterwards
 * @param ms Period to wait in milliseconds
 */
export async function sleep (ms: number): Promise<void> {
  return await new Promise(resolve => setTimeout(resolve, ms))
}
