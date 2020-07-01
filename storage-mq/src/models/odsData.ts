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

/**
 * Function to generate one table scheme for several tables.
 * The table will be generated upon successful database connection.
 * 
 * This is needed due to having many tables with this scheme.
 * 
 * @param tableName tablename of the table to be created with this scheme 
 * 
 * @returns         the entity schema for passing to the connection options 
 *                  for connection creation
 */
export function createTableEntity(tableName: string) {

  @Entity({ name: tableName })
  class ODSDataTable{

    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'jsonb', nullable: true })
    data!: object

    @Column({ type: 'timestamp', nullable: false })
    timestamp!: Date

    @Column()
    origin!: string

    @Column()
    license!: string

    @Column()
    pipelineId!: string
  }

  return ODSDataTable
}

