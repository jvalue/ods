import express from 'express';

import { asyncHandler } from '../../../adapter/api/rest/utils';
import { DataImportRepository } from '../../repository/dataImportRepository';
import { KnexHelper } from '../../repository/knexHelper';

const dataImportRepository: DataImportRepository = new DataImportRepository();

export class DataImportEndpoint {
  registerRoutes = (app: express.Application): void => {
    app.get(
      '/datasources/:datasourceId/imports',
      asyncHandler(this.getMetaDataImportsForDatasource),
    );
    app.get(
      '/datasources/:datasourceId/imports/latest',
      asyncHandler(this.getLatestMetaDataImportForDatasource),
    );
    app.get(
      '/datasources/:datasourceId/imports/latest/data',
      asyncHandler(this.getLatestDataImportForDatasource),
    );
    app.get(
      '/datasources/:datasourceId/imports/:dataImportId',
      asyncHandler(this.getMetadataForDataImport),
    );
    app.get(
      '/datasources/:datasourceId/imports/:dataImportId/data',
      asyncHandler(this.getDataFromDataImport),
    );
  };
  // TODO Transactional bei gets???
  getMetaDataImportsForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const result: any =
      await dataImportRepository.getMetaDataImportByDatasource(
        req.params.datasourceId,
      );
    let i = 0;
    const dataSourceId: string = req.params.datasourceId;
    result.forEach(function (el: Record<string, unknown>) {
      const dataImportId: number = el.id as number;
      result[i].location =
        '/datasources/' +
        dataSourceId +
        '/imports/' +
        dataImportId.toString() +
        '/data';
      i++;
    });

    res.status(200).send(result);
  };

  getLatestMetaDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const id: string = req.params.datasourceId;
    const result =
      await dataImportRepository.getLatestMetaDataImportByDatasourceId(id);
    if (checkResult(result)) {
      res.status(400).send('Protocol not supported');
      return;
    }
    const dataImportId: number = result[0].id as number;
    result[0].location =
      '/datasources/' + id + '/imports/' + dataImportId.toString() + '/data';
    res.status(200).send(result[0]);
  };

  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const id = req.params.datasourceId;
    const result = await dataImportRepository.getLatestDataImportByDatasourceId(
      id,
    );
    if (checkResult(result)) {
      res.status(400).send('Protocol not supported');
      return;
    }
    const stringResult = KnexHelper.stringFromUTF8Array(result[0].data);
    res.status(200).send(stringResult);
  };

  getMetadataForDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const datasourceId: string = req.params.datasourceId;
    const dataImportId: string = req.params.dataImportId;
    const result = await dataImportRepository.getMetadataForDataImport(
      datasourceId,
      dataImportId,
    );
    if (checkResult(result)) {
      res.status(400).send('Protocol not supported');
      return;
    }
    res.status(200).send(result[0]);
  };

  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const datasourceId: string = req.params.datasourceId;
    const dataImportId: string = req.params.dataImportId;
    const returnDataImportResponse =
      await dataImportRepository.getDataFromDataImportWithParameter(
        datasourceId,
        dataImportId,
      );

    const result: Record<string, unknown> = {};
    const keys = Object.keys(returnDataImportResponse);
    for (const entry of keys) {
      if (entry === 'data') {
        continue;
      }
      result[entry] = returnDataImportResponse[entry];
    }
    const data: Record<string, unknown> = JSON.parse(
      returnDataImportResponse.data as string,
    ) as Record<string, unknown>;
    const dataKeys = Object.keys(data);
    for (const entry of dataKeys) {
      result[entry] = data[entry];
    }

    res.status(200).send(result);
  };
}
function checkResult(result: any): boolean {
  // Will evalute to true if value is null, undefined, NaN, '', 0 , false
  if (!result || !result[0]) {
    return true;
  }
  return false;
}
