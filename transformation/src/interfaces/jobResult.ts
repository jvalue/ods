import Stats from './stats'
import JobError from './jobError'

/**
 * @swagger
 * definitions:
 *   JobResult:
 *     type: object
 *     required:
 *       - stats
 *     properties:
 *       data:
 *         description: Tansformed data, if no error occured
 *         type: object
 *       error:
 *         description: Error, if occured.
 *         $ref: '#/definitions/JobError'
 *       stats:
 *         description: Stats about the transformation execution
 *         $ref: '#/definitions/JobStats'
 */
function swaggerDummyJobResult() { } // transpilation needs function to copy swagger annotation to dist directory
export default interface JobResult {
  data?: object;
  error?: JobError;
  stats: Stats;
}
