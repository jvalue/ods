import {DatasourceInsertStatement} from "../model/DatasourceInsertStatement";
import {KnexHelper} from "./knexHelper";
import {DataImportInsertStatement} from "../model/DataImportInsertStatement";

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: '5432',
    user: 'adapterservice',
    password: 'admin',
    database: 'adapterservice',
    asyncStackTraces: true,
  },
});


export class DataImportRepository {
  async getMetaDataImportByDatasource(datasourceId: string) {
    return await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', datasourceId);
  }

  async getLatestMetaDataImportByDatasourceId(id: string) {
    return await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', id)
      .orderBy('timestamp', 'desc');
  }

  async getLatestDataImportByDatasourceId(id: string) {
    return await knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id', id)
      .orderBy('timestamp', 'desc');
  }

  async getMetadataForDataImport(datasourceId: string, dataImportId: string) {
    return await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', datasourceId)
      .andWhere('id', dataImportId);
  }

  async getDataFromDataImport(datasourceId: string, dataImportId: string) {
    return await knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id', datasourceId)
      .andWhere('id', dataImportId);
  }

  async addDataImport(insertStatement: DataImportInsertStatement) {
    return await knex('public.data_import')
      .insert(insertStatement)
      .returning('id')
      .then(function (id: any) {
        console.log(id);
        console.log('neuer code geht');
        return knex
          .select()
          .from('public.data_import')
          .where('id', id[0].id)
          .then(function (result: any) {
            return KnexHelper.createDataImportFromResult(result);
          });
      })
      .catch(function (err: any) {
        console.log(err);
      });
  }
}
