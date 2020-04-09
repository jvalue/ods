import schedule from 'node-schedule'
import DatasourceConfig from './datasource-config'

/**
   * @swagger
   * definitions:
   *   SchedulingJob:
   *     type: object
   *     required:
   *       - scheduleJob
   *       - datasourceConfig
   *     properties:
   *       scheduleJob:
   *         type: object
   *       datasourceConfig:
   *         $ref: '#/definitions/DatasourceConfig'
   */
function swaggerDummy() { } // transpilation needs function to copy swagger annotation to dist directory

export default interface SchedulingJob {
  scheduleJob: schedule.Job;
  datasourceConfig: DatasourceConfig;
}
