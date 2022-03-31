import express, {Express, json} from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";
import {DataImportRepository} from "../../repository/dataImportRepository";
import {KnexHelper} from "../../repository/knexHelper";

const dataImportRepository: DataImportRepository = new DataImportRepository();


export class DataImportEndpoint {
  registerRoutes = (app: express.Application): void => {
    app.get('/datasources/:datasourceId/imports', asyncHandler(this.getMetaDataImportsForDatasource));
    app.get('/datasources/:datasourceId/imports/latest', asyncHandler(this.getLatestMetaDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/latest/data', asyncHandler(this.getLatestDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/:dataImportId', asyncHandler(this.getMetadataForDataImport));
    app.get('/datasources/:datasourceId/imports/:dataImportId/data', asyncHandler(this.getDataFromDataImport));
  };
  getMetaDataImportsForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let result = await dataImportRepository.getMetaDataImportByDatasource(req.params.datasourceId)
    let i = 0;
    result.forEach(function (el: any) {
      let dataImportId = el.id;
      result[i]["location"] = "/datasources/" + req.params.datasourceId + "/imports/" + dataImportId + "/data";
      i++;
    })

    res.status(200).send(result);
  };
  getLatestMetaDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let id = req.params.datasourceId;
    let result = await dataImportRepository.getLatestMetaDataImportByDatasourceId(id);
    let dataImportId = result[0].id;
    result[0]["location"] = "/datasources/" + req.params.datasourceId + "/imports/" + dataImportId + "/data";
    res.status(200).send(result[0]);

  };
  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let id = req.params.datasourceId;
    let result = await dataImportRepository.getLatestDataImportByDatasourceId(id);
    const stringResult = KnexHelper.stringFromUTF8Array(result[0].data)
    res.status(200).send(stringResult);
  };


  getMetadataForDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId = req.params.datasourceId;
    let dataImportId = req.params.dataImportId;
    let result = await dataImportRepository.getMetadataForDataImport(datasourceId, dataImportId);
    res.status(200).send(result[0]);
  };


  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId = req.params.datasourceId;
    let dataImportId = req.params.dataImportId;
    let result = await dataImportRepository.getDataFromDataImport(datasourceId, dataImportId);
    const stringFromUTF8Array = KnexHelper.stringFromUTF8Array(result[0].data)
    res.status(200).send(stringFromUTF8Array);
  };


}
