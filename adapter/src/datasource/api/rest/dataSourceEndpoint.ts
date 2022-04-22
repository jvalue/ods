import express from 'express';

import { AdapterEndpoint } from '../../../adapter/api/rest/adapterEndpoint';
import { asyncHandler } from '../../../adapter/api/rest/utils';
import { AdapterConfig } from '../../../adapter/model/AdapterConfig';
import { Format } from '../../../adapter/model/enum/Format';
import { Protocol } from '../../../adapter/model/enum/Protocol';
import { FormatConfig } from '../../../adapter/model/FormatConfig';
import { ProtocolConfig } from '../../../adapter/model/ProtocolConfig';
import { AdapterService } from '../../../adapter/services/adapterService';
import { ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC } from '../../../env';
import { DatasourceModelForAmqp } from '../../model/datasourceModelForAmqp';
import { DatasourceRepository } from '../../repository/datasourceRepository';
import { KnexHelper } from '../../repository/knexHelper';
import { OutboxRepository } from '../../repository/outboxRepository';

const datasourceRepository: DatasourceRepository = new DatasourceRepository();
const outboxRepository: OutboxRepository = new OutboxRepository();

export class DataSourceEndpoint {
  registerRoutes = (app: express.Application): void => {
    app.get('/datasources', asyncHandler(this.getAllDataSources));
    app.get('/datasources/:datasourceId', asyncHandler(this.getDataSource));
    app.post('/datasources', asyncHandler(this.addDatasource));
    app.put('/datasources/:datasourceId', asyncHandler(this.updateDatasource));
    app.delete('/datasources/', asyncHandler(this.deleteAllDatasources));
    app.delete(
      '/datasources/:datasourceId',
      asyncHandler(this.deleteDatasource),
    );
    app.post(
      '/datasources/:datasourceId/trigger',
      asyncHandler(this.triggerDataImportForDatasource),
    );
  };
  getAllDataSources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const result = await datasourceRepository.getAllDataSources();
    const datasource = KnexHelper.createDatasourceFromResultArray(result);
    res.status(200).send(datasource);
  };

  getDataSource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    console.log(req.params.datasourceId);
    const datasource = await datasourceRepository.getDataSourceById(
      req.params.datasourceId,
    );
    res.status(200).send(datasource);
  };

  addDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // Routingkey == topic
    // TODO typisierung Datasource & Dataimport
    const insertStatement = KnexHelper.getInsertStatementForDataSource(req);
    const datasource = await datasourceRepository.addDatasource(
      insertStatement,
    );
    const datasouceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    // Let routingKey=ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC;
    const routingKey = 'datasource.config.created';
    await outboxRepository.publishToOutbox(datasouceModelForAmqp, routingKey);
    res.status(201).send(datasource);
  };

  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO check response 204 with no body ?!
    const insertStatement = KnexHelper.getInsertStatementForDataSource(req);
    const datasource = await datasourceRepository.updateDatasource(
      insertStatement,
      req.params.datasourceId,
    );
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    // Let routingKey=ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC;
    const routingKey = 'datasource.config.updated';
    await outboxRepository.publishToOutbox(datasourceModelForAmqp, routingKey);
    res.status(200).send(datasource);
  };

  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let id = req.params.datasourceId;
    const datasource = await datasourceRepository.getDataSourceById(id);
    await datasourceRepository.deleteDatasourceById(id);
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    const routingKey = 'datasource.config.deleted';
    await outboxRepository.publishToOutbox(datasourceModelForAmqp, routingKey);
    res.status(204).send();
  };

  deleteAllDatasources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    await datasourceRepository.deleteAllDatasources();
    //TODO publish all Deletions
    res.status(204).send();
  };

  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO add parameters from request to trigger
    // TODO Error Handling general here when datasource == null
    const id = req.params.datasourceId;
    const datasource = await datasourceRepository.getDataSourceById(id);
    const protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(Protocol.HTTP),
      parameters: datasource.protocol.parameters,
    };
    const format = new Format(
      AdapterEndpoint.getFormat(datasource.format.type),
    );
    const formatConfigObj: FormatConfig = {
      format: format,
      parameters: datasource.format.parameters,
    };
    const adapterConfig: AdapterConfig = {
      protocolConfig: protocolConfigObj,
      formatConfig: formatConfigObj,
    };
    const returnDataImportResponse =
      await AdapterService.getInstance().executeJob(adapterConfig);
    // //TODO save response in dataimport table
    // TODO check correct response
    //TODO publish Imports
    res.status(200).send(returnDataImportResponse);
  };
}
