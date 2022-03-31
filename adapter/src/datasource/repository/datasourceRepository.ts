import {DataSourceEndpoint, InsertStatement} from "../api/rest/dataSourceEndpoint";

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

  async getDataSourceById(id: any) {
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
            return DataSourceEndpoint.createDatasourceFromResult(result);
          })
      })
      .catch(function (err: any) {
        console.log(err)
      })
  }

  async updateDatasource(insertStatement: InsertStatement, datasourceId: string) {
    return await knex('public.datasource')
      .where('id', datasourceId)
      .update(insertStatement)
      .then(function () {
        return knex
          .select()
          .from('public.datasource')
          .where('id', datasourceId)
          .then(function (result: any) {
            console.log(result)
            return DataSourceEndpoint.createDatasourceFromResult(result);
          })
      })
      .catch(function (err: any) {
        console.log(err)
      })
  }

  async deleteDatasourceById(datasourceId: string) {
    return await knex
      .delete()
      .from('public.datasource')
      .where('id', datasourceId);
  }

  async deleteAllDatasources() {
    return await knex
      .delete()
      .from('public.datasource')
      .where('id', '!=', "-1")
  }


}
