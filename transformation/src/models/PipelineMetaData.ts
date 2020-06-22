import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, JoinColumn, OneToOne } from 'typeorm';

// psql -U transformation_usr -c "insert into pipeline_meta_data(\"displayName\", \"description\", \"author\", \"license\") values('a', 'b', 'c', 'd');INSERT into transformation_config (\"func\", \"datasourceId\", \"metadataId\") values ('aaaa',2 ,1)";

//insert into pipeline_meta_data("displayName", "description", "author", "license") values('a', 'b', 'c', 'd');
//INSERT into transformation_config ("func", "datasourceId", "metadataId") values ('aaaa',2 ,1);

// [
//     {
//         "pipelineId": 2,
//         "func": "aaaa",
//         "datasourceId": 2,
//         "metadata": {
//             "id": 1,
//             "displayName": "a",
//             "description": "b",
//             "author": "c",
//             "license": "d"
//         }
//     }
// ]


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