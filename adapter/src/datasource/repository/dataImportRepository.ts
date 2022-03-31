const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: '5432',
    user: 'adapterservice',
    password: 'admin',
    database: 'adapterservice',
    asyncStackTraces: true
  }
});
export class DataImportRepository {

  async getMetaDataImportByDatasource(datasourceId: string) {
    return  await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', datasourceId)
  }

  async getLatestMetaDataImportByDatasourceId(id: string) {
    return await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', id)
      .orderBy('timestamp', 'desc');
  }

  async getLatestDataImportByDatasourceId(id: string) {
    return await  knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id', id)
      .orderBy('timestamp', 'desc')
  }

  async getMetadataForDataImport(datasourceId: string, dataImportId: string) {
    return await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', datasourceId)
      .andWhere('id', dataImportId)
  }

  async getDataFromDataImport(datasourceId: string, dataImportId: string) {
   return  await knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id', datasourceId)
      .andWhere('id', dataImportId)
  }
}
