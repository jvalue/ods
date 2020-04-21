
/**
 * @swagger
 * definitions:
 *   JobError:
 *     type: object
 *     required:
 *       - name
 *       - message
 *       - lineNumber
 *       - position
 *       - stacktrace
 *     properties:
 *       name:
 *         description: Error name
 *         type: string
 *       message:
 *         description: Error message
 *         type: string
 *       lineNumber:
 *         description: Line number where error occured
 *         type: number
 *       stacktrace:
 *         description: The stacktrace.
 *         type: array
 *         items:
 *           type: string
 */
function swaggerDummyJobError() { } // transpilation needs function to copy swagger annotation to dist directory
export default interface JobError {
  name: string;
  message: string;
  lineNumber: number;
  position: number;
  stacktrace: string[];
}
