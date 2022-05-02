import { ClientBase } from 'pg';

import { DatasourceInsertStatement } from '../model/DatasourceInsertStatement';

import { KnexHelper } from './knexHelper';

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

const CREATE_DATASOURCE_REPOSITORY_STATEMENT = `
  CREATE TABLE IF NOT EXISTS public.datasource (
  "id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
  "format_parameters" varchar,
  "format_type" varchar,
  "author" varchar,
  "creation_timestamp" timestamp,
  "description" varchar,
  "display_name" varchar,
  "license" varchar,
  "protocol_parameters" text,
  "protocol_type" varchar,
  "first_execution" timestamp,
  "interval" bigint,
  "periodic" boolean,
  CONSTRAINT "Data_pk_public.datasource" PRIMARY KEY (id)
)`;

export async function createDatasourceTable(client: ClientBase): Promise<void> {
  await client.query(CREATE_DATASOURCE_REPOSITORY_STATEMENT);
}

export class DatasourceRepository {
  async getAllDataSources() {
    const result = await knex.select().from('public.datasource');
    return KnexHelper.createDatasourceFromResultArray(result);
  }

  async getDataSourceById(id: any) {
    const result = await knex
      .select()
      .from('public.datasource')
      .where('id', id);
    return KnexHelper.createDatasourceFromResult(result);
  }

  async addDatasource(insertStatement: DatasourceInsertStatement) {
    return await knex('public.datasource')
      .insert(insertStatement)
      .returning('id')
      .then(function (id: any) {
        console.log(id);
        console.log('neuer code geht');
        return knex
          .select()
          .from('public.datasource')
          .where('id', id[0].id)
          .then(function (result: any) {
            return KnexHelper.createDatasourceFromResult(result);
          });
      })
      .catch(function (err: any) {
        console.log(err);
      });
  }

  async updateDatasource(
    insertStatement: DatasourceInsertStatement,
    datasourceId: string,
  ) {
    return await knex('public.datasource')
      .where('id', datasourceId)
      .update(insertStatement)
      .then(function () {
        return knex
          .select()
          .from('public.datasource')
          .where('id', datasourceId)
          .then(function (result: any) {
            console.log(result);
            return KnexHelper.createDatasourceFromResult(result);
          });
      })
      .catch(function (err: any) {
        console.log(err);
      });
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
      .where('id', '!=', '-1');
  }
}
