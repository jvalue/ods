import {DataSourceAndImportEndpoint, InsertStatement} from "../api/rest/dataSourceAndImportEndpoint";

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
export class DatasourceRepository {



  async getAllDataSources() {
    return await knex
      .select()
      .from('public.datasource')
  }
  async  getDataSourceForDataSourceId(id:any) {
    return await knex
      .select()
      .from('public.datasource')
      .where('id', id);
  }

  async addDatasource(insertStatement: InsertStatement) {
    return await knex('public.datasource')
      .insert(insertStatement)
      .returning('id')
      .then(function (id: any) {
        console.log(id)
        console.log("neuer code geht")
        return knex
          .select()
          .from('public.datasource')
          .where('id', id[0].id)
          .then(function (result: any) {
            return DataSourceAndImportEndpoint.createDatasourceFromResult(result);
          })
      })
      .catch(function (err: any) {
        console.log(err)
      })
  }
}
