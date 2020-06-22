import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export default class TransformationData{
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    func!: string
}