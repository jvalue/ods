import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm';

// @Entity()
// export class Pipeline{
//     @PrimaryColumn()
//     id!: number;

//     @Column()
//     datasourceId!: number;
    
//     @Column()
//     metadata!: PipelineMetaData;

//     @Column()
//     transformation!: TransformationConfig;
// }

// @Entity()
// export class PipelineMetaData{
//     displayName!: string;
//     description!: string;
//     author!: string;
//     license!: string;
// }

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