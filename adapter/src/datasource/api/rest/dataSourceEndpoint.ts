import express from "express";
import {asyncHandler} from "../../../adapter/api/rest/utils";
import {AdapterConfig} from "../../../adapter/model/AdapterConfig";
import {AdapterService} from "../../../adapter/services/adapterService";
import {ProtocolConfig} from "../../../adapter/model/ProtocolConfig";
import {Protocol} from "../../../adapter/model/enum/Protocol";
import {Format} from "../../../adapter/model/enum/Format";
import {FormatConfig} from "../../../adapter/model/FormatConfig";
import {AdapterEndpoint} from "../../../adapter/api/rest/adapterEndpoint";
import {DatasourceRepository} from "../../repository/datasourceRepository";
import {KnexHelper} from "../../repository/knexHelper";
import {OutboxRepository} from "../../repository/outboxRepository";
import {DatasourceModelForAmqp} from "../../model/datasourceModelForAmqp";
import {ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC} from "../../../env";


const datasourceRepository: DatasourceRepository = new DatasourceRepository();
const outboxRepository: OutboxRepository = new OutboxRepository();


export class DataSourceEndpoint {

  registerRoutes = (app: express.Application): void => {
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
    const result = await datasourceRepository.getAllDataSources();
    let datasource = KnexHelper.createDatasourceFromResultArray(result);
    res.status(200).send(datasource);
  };

  getDataSource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {

    console.log(req.params.datasourceId)
    const result = await datasourceRepository.getDataSourceById(req.params.datasourceId)
    let datasource = KnexHelper.createDatasourceFromResult(result);
    res.status(200).send(datasource);
  };

  addDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //routingkey == topic
    //TODO typisierung Datasource & Dataimport
    let insertStatement = KnexHelper.getInsertStatementForDataSource(req)
    let datasource = await datasourceRepository.addDatasource(insertStatement);
    let datasouceModelForAmqp:DatasourceModelForAmqp={
      datasource:datasource
    }
    // let routingKey=ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC;
    let routingKey="datasource.config.created";
    await outboxRepository.publishToOutbox(datasouceModelForAmqp,routingKey);
    res.status(201).send(datasource);
  };

  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    //TODO check response 204 with no body ?!
    let insertStatement = KnexHelper.getInsertStatementForDataSource(req)
    let datasource = await datasourceRepository.updateDatasource(insertStatement, req.params.datasourceId);
    let datasourceModelForAmqp:DatasourceModelForAmqp ={
      datasource:datasource
    }
    // let routingKey=ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC;
    let routingKey="datasource.config.updated";
    await outboxRepository.publishToOutbox(datasourceModelForAmqp,routingKey)
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
    let datasource = KnexHelper.createDatasourceFromResult(result);
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


}


