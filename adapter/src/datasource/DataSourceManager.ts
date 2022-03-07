
export class DataSourceManager {
  constructor() {
  }

  static getMetaDataImportsForDatasource(dataSourceId: string): string {
    //TODO add fancy postgre connection + sql
    return "getMetaDataImportsForDatasource with " + dataSourceId;
  }

  static getLatestMetaDataImportsForDatasource(dataSourceId: string): string {
    //TODO add fancy postgre connection + sql
    return "getLatestMetaDataImportsForDatasource with " + dataSourceId;
  }

  static getLatestDataImportForDatasource(dataSourceId: string): string {
    //TODO add fancy postgre connection + sql
    return "getLatestDataImportForDatasource with " + dataSourceId;
  }

  static getMetadataForDataImport(dataSourceId: string, dataImportId: string): string {
    //TODO add fancy postgre connection + sql
    return "getMetadataForDataImport for " + dataSourceId + ", " + dataImportId;
  }

  static getDataFromDataImport(dataSourceId: string, dataImportId: string): string {
    //TODO add fancy postgre connection + sql
    return "getDataFromDataImport for " + dataSourceId + ", " + dataImportId;
  }
}

module.exports = DataSourceManager;
