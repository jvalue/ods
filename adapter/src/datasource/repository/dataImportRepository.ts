import { ClientBase } from 'pg';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_USER,
} from '../../env';
import { DataImportInsertStatement } from '../model/DataImportInsertStatement';
import { DatasourceInsertStatement } from '../model/DatasourceInsertStatement';

import { KnexHelper } from './knexHelper';

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PW,
    database: POSTGRES_DB,
    asyncStackTraces: true,
  },
});

const CREATE_DATAIMPORT_REPOSITORY_STATEMENT = `
  CREATE TABLE IF NOT EXISTS public.data_import
(
    id bigint NOT NULL,
    data bytea,
    error_messages text[] COLLATE pg_catalog."default",
    health character varying(255) COLLATE pg_catalog."default",
    "timestamp" timestamp without time zone,
    datasource_id bigint,
    CONSTRAINT data_import_pkey PRIMARY KEY (id),
    CONSTRAINT fkdhr9x05byn63qfej3i1vw975a FOREIGN KEY (datasource_id)
        REFERENCES public.datasource (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)`;

export async function createDataImportTable(client: ClientBase): Promise<void> {
  await client.query(CREATE_DATAIMPORT_REPOSITORY_STATEMENT);
}

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
