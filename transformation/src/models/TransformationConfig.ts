import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export default class TransformationConfig{
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    func!: string
}