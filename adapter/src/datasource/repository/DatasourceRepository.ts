import { DatasourceEntity } from './Datasource.entity';
import { DatasourceInsertEntity } from './DatasourceInsert.entity';

export interface DatasourceRepository {
  getAll: () => Promise<DatasourceEntity[]>;

  getById: (id: number) => Promise<DatasourceEntity | undefined>;

  create: (
    insertStatement: DatasourceInsertEntity,
  ) => Promise<DatasourceEntity>;

  update: (
    id: number,
    insertStatement: DatasourceInsertEntity,
  ) => Promise<DatasourceEntity>;

  delete: (id: number) => Promise<void>;

  deleteAll: () => Promise<void>;
}
