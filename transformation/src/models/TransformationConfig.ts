import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { PipelineMetaData } from './PipelineMetaData';
import TransformationData from './TransformationData';

@Entity()
export class TransformationConfig {
    @PrimaryGeneratedColumn()
    id!: number 
    
    @Column({ nullable: true })
    func!: string

    @Column()
    datasourceId!: number;
    
    @OneToOne(type => PipelineMetaData, { eager: true, cascade: true, onDelete: "CASCADE" })
    @JoinColumn()
    metadata!: PipelineMetaData;

    @OneToOne(type => TransformationData, { eager: true, cascade: true, onDelete: "CASCADE" })
    @JoinColumn()
    transformation!: TransformationData
}