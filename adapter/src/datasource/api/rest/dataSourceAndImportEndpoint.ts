import express, {Express, json} from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";
import {AdapterConfig} from "../../../adapter/model/AdapterConfig";
import {AdapterService} from "../../../adapter/services/adapterService";
import {ProtocolConfig} from "../../../adapter/model/ProtocolConfig";
import {Protocol} from "../../../adapter/model/enum/Protocol";
import {Format} from "../../../adapter/model/enum/Format";
import {FormatConfig} from "../../../adapter/model/FormatConfig";
import {AdapterEndpoint} from "../../../adapter/api/rest/adapterEndpoint";
import {DatasourceRepository} from "../../repository/datasourceRepository";
import {DataImportRepository} from "../../repository/dataImportRepository";


const datasourceRepository: DatasourceRepository = new DatasourceRepository();
const dataImportRepository: DataImportRepository = new DataImportRepository();


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
    // const publisher:AmqpChannel =  await createAmqpPublisher(amqpConnection, "ods_global", "exchange", "topic");
    const result = await datasourceRepository.getAllDataSources();
    let datasource = DataSourceAndImportEndpoint.createDatasourceFromResultArray(result);
    res.status(200).send(datasource);
  };

  getDataSource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {

    console.log(req.params.datasourceId)
    const result = await datasourceRepository.getDataSourceById(req.params.datasourceId)
    let datasource = DataSourceAndImportEndpoint.createDatasourceFromResult(result);
    res.status(200).send(datasource);
  };
  addDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let insertStatement = this.getInsertStatement(req)
    let datasource = await datasourceRepository.addDatasource(insertStatement);
    res.status(201).send(datasource);
  };


  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let insertStatement = this.getInsertStatement(req)
    let datasource = await datasourceRepository.updateDatasource(insertStatement, req.params.datasourceId);
    res.status(200).send(datasource);
  };


  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    await datasourceRepository.deleteDatasourceById(req.params.datasourceId);
    res.status(204).send();
  };
  deleteAllDatasources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    await datasourceRepository.deleteAllDatasources();
    res.status(204).send();
  };

  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //TODO add parameters from request to trigger
    //TODO Error Handling general here when datasource == null
    let id = req.params.datasourceId;
    let result = await datasourceRepository.getDataSourceById(id);
    let datasource = DataSourceAndImportEndpoint.createDatasourceFromResult(result);
    let protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(Protocol.HTTP),
      parameters: datasource.protocol.parameters
    }
    let format = new Format(AdapterEndpoint.getFormat(datasource.format.type))
    let formatConfigObj: FormatConfig = {format: format, parameters: datasource.format.parameters}
    let adapterConfig: AdapterConfig = {protocolConfig: protocolConfigObj, formatConfig: formatConfigObj}
    let returnDataImportResponse = await AdapterService.getInstance().executeJob(adapterConfig);
    // //TODO save response in dataimport table
    //TODO check correct response
    res.status(200).send(returnDataImportResponse);

  };
  getMetaDataImportsForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let result = await dataImportRepository.getMetaDataImportByDatasource(req.params.datasourceId)
    let i=0;
    result.forEach(function (el:any) {
      let dataImportId=el.id;
      result[i]["location"]="/datasources/"+req.params.datasourceId+"/imports/"+dataImportId+"/data";
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
    let dataImportId=result[0].id;
    result[0]["location"]="/datasources/"+req.params.datasourceId+"/imports/"+dataImportId+"/data";
    res.status(200).send(result[0]);

  };
  getLatestDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let id = req.params.datasourceId;
    let result = await dataImportRepository.getLatestDataImportByDatasourceId(id);
    const stringResult = this.stringFromUTF8Array(result[0].data)
    res.status(200).send(stringResult);
  };


  getMetadataForDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId=req.params.datasourceId;
    let dataImportId=req.params.dataImportId;
    let result = await  dataImportRepository.getMetadataForDataImport(datasourceId,dataImportId);
    res.status(200).send(result[0]);
  };


  getDataFromDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId=req.params.datasourceId;
    let dataImportId=req.params.dataImportId;
    let result = await dataImportRepository.getDataFromDataImport(datasourceId,dataImportId);
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
      let protocolParameters = JSON.parse(el.protocol_parameters);
      let formatParameters = JSON.parse(el.format_parameters);
      let x = {
        "protocol": {
          "type": el.protocol_type,
          "parameters":
          protocolParameters

        },
        "format": {
          "type": el.format_type,
          "parameters": formatParameters
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

  static createDatasourceFromResult(result: any) {
    let protocolParameters = JSON.parse(result[0].protocol_parameters);
    let formatParameters = JSON.parse(result[0].format_parameters);
    let x = {
      "protocol": {
        "type": result[0].protocol_type,
        "parameters": protocolParameters
      },
      "format": {
        "type": result[0].format_type,
        "parameters": formatParameters
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

  private getInsertStatement(req: any): InsertStatement {
    return {
      format_parameters: req.body.format.parameters,
      format_type: req.body.format.type,
      author: req.body.metadata.author,
      creation_timestamp: new Date(Date.now()).toLocaleString(),
      description: req.body.metadata.description,
      display_name: req.body.metadata.displayName,
      license: req.body.metadata.license,
      protocol_parameters: req.body.protocol.parameters,
      protocol_type: req.body.protocol.type,
      first_execution: req.body.trigger.firstExecution,
      interval: req.body.trigger.interval,
      periodic: req.body.trigger.periodic
    };
  }
}

export interface InsertStatement {
  format_parameters: any;
  format_type: any;
  author: any;
  creation_timestamp: any;
  description: any;
  display_name: any;
  license: any;
  protocol_parameters: any;
  protocol_type: any;
  first_execution: any;
  interval: any;
  periodic: any;
}

