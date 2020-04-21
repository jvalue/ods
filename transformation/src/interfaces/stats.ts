
/**
 * @swagger
 * definitions:
 *   JobStats:
 *     type: object
 *     required:
 *       - durationInMilliSeconds
 *       - startTimestamp
 *       - endTimestamp
 *     properties:
 *       durationInMilliSeconds:
 *         description: Execution time in milliseconds
 *         type: number
 *       startTimestamp:
 *         description: Timestamp of execution start
 *         type: number
 *       endTimestamp:
 *         description:  Timestamp of execution end
 *         type: number
 */
function swaggerDummyJobStats() { } // transpilation needs function to copy swagger annotation to dist directory
export default interface Stats {
  durationInMilliSeconds: number;
  startTimestamp: number;
  endTimestamp: number;
}
