import { ClientBase } from 'pg';

import {
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_USER,
} from '../../env';
import { DataImportInsertStatement } from '../model/DataImportInsertStatement';

import { DatasourceRepository } from './datasourceRepository';
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
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
    data bytea,
    error_messages text[] COLLATE pg_catalog."default",
    health character varying(255) COLLATE pg_catalog."default",
    "timestamp" timestamp without time zone,
    datasource_id bigint,
    CONSTRAINT data_import_pkey PRIMARY KEY (id),
    CONSTRAINT fkdhr9x05byn63qfej3i1vw975a FOREIGN KEY (datasource_id)
        REFERENCES public.datasource (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    parameters character varying(255) COLLATE pg_catalog."default"
)`;

const datasourceRepository: DatasourceRepository = new DatasourceRepository();

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
      .select()
      .from('public.data_import')
      .where('datasource_id', datasourceId)
      .andWhere('id', dataImportId);
  }

  async getDataFromDataImportWithParameter(
    datasourceId: string,
    dataImportId: string,
  ) {
    const dataImport = await this.getDataFromDataImport(
      datasourceId,
      dataImportId,
    );
    const result: Record<string, unknown> = {
      data: KnexHelper.stringFromUTF8Array(dataImport[0].data),
    };

    const dataSource = await datasourceRepository.getDataSourceById(
      datasourceId,
    );

    const triggercount =
      await datasourceRepository.getTriggerCountFromDataSource(datasourceId);

    if (triggercount) {
      result.id = parseInt(triggercount.triggercount);
    }

    if (dataSource.protocol.parameters.defaultParameters) {
      const keys = Object.keys(
        dataSource.protocol.parameters.defaultParameters,
      );
      for (const entry of keys) {
        result[entry] = dataSource.protocol.parameters.defaultParameters[entry];
      }
    }

    if (JSON.parse(dataImport[0].parameters).parameters) {
      const parameters = JSON.parse(dataImport[0].parameters).parameters;
      const keys = Object.keys(parameters);
      for (const entry of keys) {
        result[entry] = parameters[entry];
      }
    }

    return result;
  }

  async addDataImport(
    dataSourceId: number,
    insertStatement: DataImportInsertStatement,
  ) {
    const result: Record<string, any> = {};
    return await knex('public.data_import')
      .insert(insertStatement)
      .returning('id')
      .then(function (id: any) {
        console.log(id);
        console.log('easdfasdfsadfsadfsadf');
        console.log('neuer code geht');
        return knex
          .select()
          .from('public.data_import')
          .where('id', id[0].id)
          .then(function (result: any) {
            const x = DataImportRepository.createDataImportFromResult(result);
            return x;
          });
      })
      .catch(function (err: any) {
        console.log(err);
      });
  }
  static createDataImportFromResult(result: any) {
    const x = {
      id: Number(result[0].id),
      data: KnexHelper.stringFromUTF8Array(result[0].data),
      error_messages: result[0].error_messages,
      health: result[0].health,
      timestamp: result[0].timestamp,
      datasource_id: result[0].datasource_id,
    };
    return x;
  }
  // Function location(){
  //   Const location='/datasources/'+dataSourceId+'/imports/'+ Number(result[0].id)+'/data';
  // }
}
