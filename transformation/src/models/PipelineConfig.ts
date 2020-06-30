import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { PipelineMetaData } from './PipelineMetaData';
import TransformationConfig from './TransformationConfig';

@Entity()
export class PipelineConfig {
    @PrimaryGeneratedColumn()
    id!: number 

    @Column()
    datasourceId!: number;
    
    @OneToOne(type => PipelineMetaData, metadata => metadata.id, { eager: true, cascade: true })
    @JoinColumn()
    metadata!: PipelineMetaData;

    @OneToOne(type => TransformationConfig, transformation => transformation.id, { eager: true, cascade: true, onDelete: "CASCADE", onUpdate: "CASCADE" })
    @JoinColumn()
    transformation!: TransformationConfig
}