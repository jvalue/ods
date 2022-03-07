import express, {Express, json} from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";
const dataSourceManager = require( "../../DataSourceManager" );
const knex = require('knex')({
  client: 'pg',
  connection: {
    host : 'localhost',
    port : '5432',
    user : 'adapterservice',
    password : 'admin',
    database : 'adapterservice',
    asyncStackTraces: true
  }
});
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
    //TODO add locations to every answer
    console.log(req.params.datasourceId)
    const result = await knex
      .select('id','timestamp','health','error_messages')
      .from('public.data_import')
      .where('datasource_id',req.params.datasourceId)
    res.status(200).send(result);
  };
   getLatestMetaDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
     console.log(req.params.datasourceId)
     let result = await knex
       .select('id','timestamp','health','error_messages')
       .from('public.data_import')
       .where('datasource_id',req.params.datasourceId)
       .orderBy('timestamp','desc')
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
      .where('datasource_id',req.params.datasourceId)
      .orderBy('timestamp','desc')
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
       .select('id','timestamp','health','error_messages')
       .from('public.data_import')
       .where('datasource_id',req.params.datasourceId)
       .andWhere('id',req.params.dataImportId)
     res.status(200).send(result[0]);
   };


  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let result = await knex
      .select('data')
      .from('public.data_import')
      .where('datasource_id',req.params.datasourceId)
      .andWhere('id',req.params.dataImportId)
    const stringFromUTF8Array = this.stringFromUTF8Array(result[0].data)
    res.status(200).send(stringFromUTF8Array);

  };
//from: https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
  stringFromUTF8Array(data:any)
  {
    const extraByteMap = [ 1, 1, 1, 1, 2, 2, 3, 0 ];
    var count = data.length;
    var str = "";

    for (var index = 0;index < count;)
    {
      var ch = data[index++];
      if (ch & 0x80)
      {
        var extra = extraByteMap[(ch >> 3) & 0x07];
        if (!(ch & 0x40) || !extra || ((index + extra) > count))
          return null;

        ch = ch & (0x3F >> extra);
        for (;extra > 0;extra -= 1)
        {
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



}
