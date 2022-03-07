import express, {Express} from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";
const dataSourceManager = require( "../../DataSourceManager" );
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

    //  access param :
    //  res.send('profile with id' + req.params.id)
    res.status(200).send( dataSourceManager.getMetaDataImportsForDatasource(req.params.datasourceId));

  };
   getLatestMetaDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {

  //  access param :
  //  res.send('profile with id' + req.params.id)
  res.status(200).send( dataSourceManager.getLatestMetaDataImportsForDatasource(req.params.datasourceId));

};
  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //  access param :
    //  res.send('profile with id' + req.params.id)
    res.status(200).send(dataSourceManager.getLatestDataImportForDatasource(req.params.datasourceId));
  };

   getMetadataForDataImport = async (
     req: express.Request,
     res: express.Response,
   ): Promise<void> => {
     //  access param :
     //  res.send('profile with id' + req.params.id)
     const datasourceId = req.params.datasourceId;
     const dataImportId= req.params.dataImportId;
     res.status(200).send(dataSourceManager.getMetadataForDataImport(datasourceId,dataImportId));
   };


  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //  access param :
    //  res.send('profile with id' + req.params.id)
    const datasourceId = req.params.datasourceId;
    const dataImportId= req.params.dataImportId;
    res.status(200).send(dataSourceManager.getDataFromDataImport(datasourceId,dataImportId));

  };




}
