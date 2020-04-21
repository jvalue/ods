/**
   * @swagger
   * definitions:
   *   TransformationRequest:
   *     description: Either data or dataLocation has to be present!
   *     type: object
   *     required:
   *       - func
   *     properties:
   *       func:
   *         description: valid JavaScript function to execute
   *         type: string
   *       data:
   *         description: data to perform func on
   *         type: object
   *       dataLocation:
   *         type: string
   *         description: URL to the data to perform func on
   */
function swaggerDummyTransformationRequest() { } // transpilation needs function to copy swagger annotation to dist directory
export default interface TransformationRequest {
  func: string;
  data: object;
  dataLocation: string;
}
