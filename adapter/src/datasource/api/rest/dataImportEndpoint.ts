import express, {Express} from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";

export class DataImportEndpoint {

  registerRoutes = (app: express.Application): void => {
    app.get('/datasources/:datasourceId/imports', asyncHandler(this.getDataImportsForDatasource));
    app.get('/datasources/:datasourceId/imports/latest', asyncHandler(this.getLatestDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/latest/data', asyncHandler(this.getLatestDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/:dataImportId', asyncHandler(this.getDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/:dataImportId/data', asyncHandler(this.getDataImportForDatasource));
  };

  getDataImportsForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {

    //  access param :
    //  res.send('profile with id' + req.params.id)
    const param = req.params.datasourceId;
    res.status(200).send("You called: /datasources/"+param+"/imports");

  };

  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //  access param :
    //  res.send('profile with id' + req.params.id)
    res.status(200).send("test");
  };

  getDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //  access param :
    //  res.send('profile with id' + req.params.id)
    const param = req.params.datasourceId;
    const dataImportId= req.params.dataImportId;
    res.status(200).send("You called: /datasources/"+param+"/imports/"+dataImportId+"/data");
  };
}
