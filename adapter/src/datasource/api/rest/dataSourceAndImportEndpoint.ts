import express, {Express, json} from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";

//TODO replace with env vars
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

export class DataSourceAndImportEndpoint {

  registerRoutes = (app: express.Application): void => {
    app.get('/datasources/:datasourceId/imports', asyncHandler(this.getMetaDataImportsForDatasource));
    app.get('/datasources/:datasourceId/imports/latest', asyncHandler(this.getLatestMetaDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/latest/data', asyncHandler(this.getLatestDataImportForDatasource));
    app.get('/datasources/:datasourceId/imports/:dataImportId', asyncHandler(this.getMetadataForDataImport));
    app.get('/datasources/:datasourceId/imports/:dataImportId/data', asyncHandler(this.getDataFromDataImport));
    app.get('/datasources', asyncHandler(this.getAllDataSources));
    app.get('/datasources/:datasourceId', asyncHandler(this.getDataSource));
    app.post('/datasources', asyncHandler(this.addDatasource));
    app.put('/datasources/:datasourceId', asyncHandler(this.updateDatasource));
    app.delete('/datasources/', asyncHandler(this.deleteAllDatasources));
    app.delete('/datasources/:datasourceId', asyncHandler(this.deleteDatasource));
    app.post('/datasources/:datasourceId/trigger', asyncHandler(this.triggerDataImportForDatasource));
  };
  getAllDataSources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const result = await knex
      .select()
      .from('public.datasource')
    let datasource = await DataSourceAndImportEndpoint.createDatasourceFromResultArray(result);
    res.status(200).send(datasource);
  };

  getDataSource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {

    console.log(req.params.datasourceId)
    const result = await knex
      .select()
      .from('public.datasource')
      .where('id', req.params.datasourceId)
    let datasource = await DataSourceAndImportEndpoint.createDatasourceFromResult(result);
    res.status(200).send(datasource);
  };
  addDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //TODO

  };
  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //TODO
  };


  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const result = await knex
      .delete()
      .from('public.datasource')
      .where('id', req.params.datasourceId)
    res.status(204).send();
  };
  deleteAllDatasources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const result = await knex
      .delete()
      .from('public.datasource')
      .where('id', '!=',"null")
    res.status(204).send();
  };


  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //TODO

  };
  getMetaDataImportsForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //TODO add locations to every answer
    console.log(req.params.datasourceId)
    const result = await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', req.params.datasourceId)
    res.status(200).send(result);
  };
  getLatestMetaDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    console.log(req.params.datasourceId)
    let result = await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', req.params.datasourceId)
      .orderBy('timestamp', 'desc')
    res.status(200).send(result[0]);

  };
  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    console.log(req.params.datasourceId)
    let result = await knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id', req.params.datasourceId)
      .orderBy('timestamp', 'desc')
    // console.log(result.data)
    const stringFromUTF8Array1 = this.stringFromUTF8Array(result[0].data)
    res.status(200).send(stringFromUTF8Array1);
  };


  getMetadataForDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //  access param :
    //  res.send('profile with id' + req.params.id)
    let result = await knex
      .select('id', 'timestamp', 'health', 'error_messages')
      .from('public.data_import')
      .where('datasource_id', req.params.datasourceId)
      .andWhere('id', req.params.dataImportId)
    res.status(200).send(result[0]);
  };


  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let result = await knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id', req.params.datasourceId)
      .andWhere('id', req.params.dataImportId)
    const stringFromUTF8Array = this.stringFromUTF8Array(result[0].data)
    res.status(200).send(stringFromUTF8Array);

  };

//from: https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  stringFromUTF8Array(data: any) {
    const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
    var count = data.length;
    var str = "";

    for (var index = 0; index < count;) {
      var ch = data[index++];
      if (ch & 0x80) {
        var extra = extraByteMap[(ch >> 3) & 0x07];
        if (!(ch & 0x40) || !extra || ((index + extra) > count))
          return null;

        ch = ch & (0x3F >> extra);
        for (; extra > 0; extra -= 1) {
          var chx = data[index++];
          if ((chx & 0xC0) != 0x80)
            return null;

          ch = (ch << 6) | (chx & 0x3F);
        }
      }

      str += String.fromCharCode(ch);
    }

    return str;
  }

  private static createDatasourceFromResultArray(result: any) {
    var test = [];
    for (var i in result) {
      var el = result[i];
      let x = {
        "protocol": {
          "type": el.protocol_type,
          "parameters":
          el.protocol_parameters

        },
        "format": {
          "type": el.format_type,
          "parameters": el.format_parameters
        },
        "metadata": {
          "author": el.author,
          "license": el.license,
          "displayName": el.display_name,
          "description": el.description,
          "creationTimestamp": el.creation_timestamp
        },
        "trigger": {
          "periodic": el.periodic,
          "firstExecution": el.first_execution,
          "interval": el.interval
        },
        "schema": el.schema,
        "id": el.id
      }
      console.log(x);
      test.push(x)
    }

    console.log("durch")
    console.log(test)


    return test;
  }

  private static createDatasourceFromResult(result: any) {

    let x = {
      "protocol": {
        "type": result[0].protocol_type,
        "parameters":
        result[0].protocol_parameters

      },
      "format": {
        "type": result[0].format_type,
        "parameters": result[0].format_parameters
      },
      "metadata": {
        "author": result[0].author,
        "license": result[0].license,
        "displayName": result[0].display_name,
        "description": result[0].description,
        "creationTimestamp": result[0].creation_timestamp
      },
      "trigger": {
        "periodic": result[0].periodic,
        "firstExecution": result[0].first_execution,
        "interval": result[0].interval
      },
      "schema": result[0].schema,
      "id": result[0].id
    }
    console.log(x);


    return x;
  }


}
