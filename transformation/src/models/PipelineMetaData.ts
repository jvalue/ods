import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, JoinColumn, OneToOne } from 'typeorm';

@Entity()
export class PipelineMetaData{
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    displayName!: string;

    @Column()
    description!: string;

    @Column()
    author!: string;

    @Column()
    license!: string;
}