import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Data consumed from the queue for these operations:
 *    * CREATE
 *    * UPDATE
 *    * DELETE
 * 
 * This datatype is embedded within dataEvent object
 */
export default interface ODSData {

  data: object

  timestamp: Date

  origin: string

  license: string

  pipelineId: string
}

