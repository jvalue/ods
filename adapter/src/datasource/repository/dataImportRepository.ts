import { DataImportEntity } from '../model/DataImport.entity';
import { DataImportInsertStatement } from '../model/DataImportInsertStatement';

export interface DataImportRepository {
  getByDatasourceId: (datasourceId: number) => Promise<DataImportEntity[]>;

  getLatestByDatasourceId: (
    id: number,
  ) => Promise<DataImportEntity | undefined>;

  getById: (dataImportId: number) => Promise<DataImportEntity | undefined>;

  create: (
    insertStatement: DataImportInsertStatement,
  ) => Promise<DataImportEntity>;
}
