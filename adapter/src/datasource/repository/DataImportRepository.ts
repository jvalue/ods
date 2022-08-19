import { DataImportEntity } from './DataImport.entity';
import { DataImportInsertEntity } from './DataImportInsert.entity';

export interface DataImportRepository {
  getByDatasourceId: (datasourceId: number) => Promise<DataImportEntity[]>;

  getLatestByDatasourceId: (
    id: number,
  ) => Promise<DataImportEntity | undefined>;

  getById: (dataImportId: number) => Promise<DataImportEntity | undefined>;

  create: (
    insertStatement: DataImportInsertEntity,
  ) => Promise<DataImportEntity>;
}
