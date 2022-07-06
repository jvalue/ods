import { DatasourceEntity } from '../model/Datasource.entity';
import { DatasourceInsertStatement } from '../model/DatasourceInsertStatement';

export interface DatasourceRepository {
  getAll: () => Promise<DatasourceEntity[]>;

  getById: (id: number) => Promise<DatasourceEntity | undefined>;

  create: (
    insertStatement: DatasourceInsertStatement,
  ) => Promise<DatasourceEntity>;

  update: (
    id: number,
    insertStatement: DatasourceInsertStatement,
  ) => Promise<DatasourceEntity>;

  delete: (id: number) => Promise<void>;

  deleteAll: () => Promise<void>;
}
