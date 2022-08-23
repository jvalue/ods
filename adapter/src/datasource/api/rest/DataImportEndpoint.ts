import express from 'express';

import { asyncHandler } from '../../../adapter/api/rest/utils';
import { DataImportEntity } from '../../repository/DataImport.entity';
import { DataImportRepository } from '../../repository/DataImportRepository';
import { DatasourceRepository } from '../../repository/DatasourceRepository';
import { DatasourceUtils } from '../../utils';
import {
  DataImportMetaDataDTO,
  dataImportEntityToDataDTO,
  dataImportEntityToMetaDataDTO,
} from '../DataImport.dto';
import { datasourceEntityToDTO } from '../Datasource.dto';

export class DataImportEndpoint {
  constructor(
    private readonly dataImportRepository: DataImportRepository,
    private readonly datasourceRepository: DatasourceRepository,
  ) {}

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

  getMetaDataImportsForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId;
    try {
      datasourceId = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('datasourceId has to be an integer!');
      return;
    }
    const result = await this.dataImportRepository.getByDatasourceId(
      datasourceId,
    );
    const dataSourceId: string = req.params.datasourceId;
    const resultDTO: DataImportMetaDataDTO[] = result.map(
      (el: DataImportEntity) =>
        dataImportEntityToMetaDataDTO(
          el,
          `/datasources/${dataSourceId}/imports/${el.id}/data`,
        ),
    );

    res.status(200).send(resultDTO);
  };

  getLatestMetaDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId;
    try {
      datasourceId = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('datasourceId has to be an integer!');
      return;
    }
    const result = await this.dataImportRepository.getLatestByDatasourceId(
      datasourceId,
    );
    if (!this.validateEntity(result)) {
      res.status(400).send('Protocol not supported');
      return;
    }
    const dataImportId: number = result.id;
    const resultDTS = dataImportEntityToMetaDataDTO(
      result,
      `/datasources/${datasourceId}/imports/${dataImportId}/data`,
    );
    res.status(200).send(resultDTS);
  };

  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId;
    try {
      datasourceId = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('datasourceId has to be an integer!');
      return;
    }
    const result = await this.dataImportRepository.getLatestByDatasourceId(
      datasourceId,
    );
    if (!this.validateEntity(result)) {
      res.status(400).send('Protocol not supported');
      return;
    }
    const stringResult = DatasourceUtils.stringFromUTF8Array(result.data);
    res.status(200).send(stringResult);
  };

  getMetadataForDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let dataImportId;
    try {
      dataImportId = Number.parseInt(req.params.dataImportId, 10);
    } catch (e) {
      res.status(400).send('dataImportId has to be an integer!');
      return;
    }
    const result = await this.dataImportRepository.getById(dataImportId);
    if (!this.validateEntity(result)) {
      res.status(400).send('Protocol not supported');
      return;
    }
    res.status(200).send(dataImportEntityToMetaDataDTO(result));
  };

  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId;
    let dataImportId;
    try {
      datasourceId = Number.parseInt(req.params.datasourceId, 10);
      dataImportId = Number.parseInt(req.params.dataImportId, 10);
    } catch (e) {
      res
        .status(400)
        .send('datasourceId and dataImportId have to be integers!');
      return;
    }
    const dataImportEntity = await this.dataImportRepository.getById(
      dataImportId,
    );
    if (!this.validateEntity(dataImportEntity)) {
      res.status(404).send(`No DataImport found for id ${dataImportId}`);
      return;
    }
    const datasourceEntity = await this.datasourceRepository.getById(
      datasourceId,
    );
    if (!this.validateEntity(datasourceEntity)) {
      res.status(404).send(`No Datasource found for id ${dataImportId}`);
      return;
    }
    const datasourceDTO = datasourceEntityToDTO(datasourceEntity);

    // Create parameters for dataImportDataDTO (use datasource default as base and overwrite with dataImport params)
    const dataImportDTOParams = {};
    if (datasourceDTO.protocol.parameters.defaultParameters !== undefined) {
      Object.assign(
        dataImportDTOParams,
        datasourceDTO.protocol.parameters.defaultParameters,
      );
    }
    const dataImportParams = JSON.parse(dataImportEntity.parameters) as Record<
      string,
      unknown
    >;
    if (dataImportParams.parameters !== undefined) {
      Object.assign(
        dataImportDTOParams,
        dataImportParams.parameters as Record<string, unknown>,
      );
    }

    const dataImportDataDTO = dataImportEntityToDataDTO(
      dataImportEntity,
      undefined,
      dataImportDTOParams,
    );

    if (dataImportDataDTO.data === '') {
      res
        .status(404)
        .send(`No data found for dataImport with id ${dataImportId}`);
      return;
    }
    res.status(200).send(JSON.parse(dataImportDataDTO.data));
  };

  private validateEntity(result: unknown): result is DataImportEntity {
    if (result === undefined) {
      return false;
    }
    return true;
  }
}