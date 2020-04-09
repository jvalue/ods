/**
   * @swagger
   * definitions:
   *   DatasourceConfig:
   *     type: object
   *     required:
   *       - id
   *       - protocol
   *       - format
   *       - trigger
   *       - metadata
   *     properties:
   *       id:
   *         type: number
   *       protocol:
   *         $ref: '#/definitions/DatasourceProtocol'
   *       format:
   *         type: object
   *         description: Just passing through what is received from adapter service
   *       trigger:
   *         $ref: '#/definitions/DatasourceTrigger'
   *       metadata:
   *         type: object
   *         description: Just passing through what is received from adapter service
   */
function swaggerDummyDatasourceConfig() { } // transpilation needs function to copy swagger annotation to dist directory
export default interface DatasourceConfig {
  id: number;
  protocol: DatasourceProtocol;
  format: object;
  trigger: DatasourceTrigger;
  metadata: object;
}

/**
   * @swagger
   * definitions:
   *   DatasourceProtocol:
   *     type: object
   *     required:
   *       - type
   *     properties:
   *       type:
   *         type: string
   *       parameters:
   *         type: object
   *         description: Just passing through what is received from adapter service; location can be included as one of them.
   */
function swaggerDummyDatasourceProtocol() { } // transpilation needs function to copy swagger annotation to dist directory
export interface DatasourceProtocol {
  type: String,
  parameters: {
    location?: String
  }
}

/**
   * @swagger
   * definitions:
   *   DatasourceTrigger:
   *     type: object
   *     required:
   *       - periodic
   *       - firstExecution
   *       - interval
   *     properties:
   *       periodic:
   *         type: boolean
   *       firstExecution:
   *         type: string
   *         format: date-string
   *         description: First execution time, if periodic repeat after interval consistently
   *       interval:
   *         type: number
   *         description: Interval in ms (if periodic)
   */
function swaggerDummyDatasourceTrigger() { } // transpilation needs function to copy swagger annotation to dist directory
export interface DatasourceTrigger {
  periodic: boolean;
  firstExecution: Date;
  interval: number;
}
