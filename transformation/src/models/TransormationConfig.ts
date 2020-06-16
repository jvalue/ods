import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TransformationConfig {

    @PrimaryGeneratedColumn()
    id!: number

    @Column() // TODO: CHeck 1:1 Relation to pipeline ? --> Delete id, make this primary
    pipelineId!: number 
    
    @Column()
    func!: string

    @Column()
    dataLocation!: string;
}