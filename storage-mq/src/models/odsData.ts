import { Entity,  Column,  PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export default class ODSData{
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