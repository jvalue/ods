import express from 'express';

import { AdapterEndpoint } from '../../../adapter/api/rest/adapterEndpoint';
import { asyncHandler } from '../../../adapter/api/rest/utils';
import { AdapterConfig } from '../../../adapter/model/AdapterConfig';
import { Format } from '../../../adapter/model/enum/Format';
import { Protocol } from '../../../adapter/model/enum/Protocol';
import { FormatConfig } from '../../../adapter/model/FormatConfig';
import { ProtocolConfig } from '../../../adapter/model/ProtocolConfig';
import { AdapterService } from '../../../adapter/services/adapterService';
import {
  ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
  ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC,
} from '../../../env';
import { DataImportInsertStatement } from '../../model/DataImportInsertStatement';
import { DatasourceConfigValidator } from '../../model/DatasourceConfigValidator';
import { DatasourceModelForAmqp } from '../../model/datasourceModelForAmqp';
import { DataImportRepository } from '../../repository/dataImportRepository';
import { DatasourceRepository } from '../../repository/datasourceRepository';
import { KnexHelper } from '../../repository/knexHelper';
import { OutboxRepository } from '../../repository/outboxRepository';

const datasourceRepository: DatasourceRepository = new DatasourceRepository();
const dataImportRepository: DataImportRepository = new DataImportRepository();
const outboxRepository: OutboxRepository = new OutboxRepository();

// Export interface RuntimeParamters {
//   Parameters: KeyValuePair[];
// }

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
    const datasource = await datasourceRepository.getAllDataSources();
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
    const validator = new DatasourceConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    try {
      DataSourceEndpoint.getProtocol(req.body.protocol.type);
    } catch (e) {
      res.status(400).send('Protocol not supported');
      return;
    }
    try {
      DataSourceEndpoint.getFormat(req.body.format.type);
    } catch (e) {
      res.status(400).send('Format not supported');
      return;
    }
    const insertStatement = KnexHelper.getInsertStatementForDataSource(req);
    const datasource: unknown = await datasourceRepository.addDatasource(
      insertStatement,
    );
    const datasouceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    const routingKey = ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC;
    // Const routingKey = 'datasource.config.created';
    await outboxRepository.publishToOutbox(datasouceModelForAmqp, routingKey);
    res.header('location', req.headers.host + req.url + '/' + datasource.id);
    res.status(201).send(datasource);
  };

  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const insertStatement = KnexHelper.getInsertStatementForDataSource(req);
    const datasource: unknown = await datasourceRepository.updateDatasource(
      insertStatement,
      req.params.datasourceId,
    );
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    const routingKey = ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC;
    await outboxRepository.publishToOutbox(datasourceModelForAmqp, routingKey);
    res.status(204).send(datasource);
  };

  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const id = req.params.datasourceId;
    const datasource = await datasourceRepository.getDataSourceById(id);
    await datasourceRepository.deleteDatasourceById(id);
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    // Const routingKey = 'datasource.config.deleted';
    const routingKey = ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC;
    await outboxRepository.publishToOutbox(datasourceModelForAmqp, routingKey);
    res.status(204).send();
  };

  deleteAllDatasources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const datasourcesToDelete = await datasourceRepository.getAllDataSources();
    await datasourceRepository.deleteAllDatasources();
    // Const routingKey = 'datasource.config.deleted';
    const routingKey = ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC;
    // TODO fix wrong entry in outbox database
    for (const dataSourceDeleted in datasourcesToDelete) {
      const datasourceModelForAmqp: DatasourceModelForAmqp = {
        datasource: datasourcesToDelete[dataSourceDeleted],
      };
      await outboxRepository.publishToOutbox(
        datasourceModelForAmqp,
        routingKey,
      );
    }
    res.status(204).send();
  };
  // Example TODO delete
  // {
  //   "id": 72,
  //   "timestamp": "2022-04-27T11:11:11.648Z",
  //   "health": "OK",
  //   "errorMessages": [],
  //   "location": "/datasources/1/imports/72/data"
  // }
  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const id = req.params.datasourceId;
    const datasource = await datasourceRepository.getDataSourceById(id);
    const runtimeParameters: unknown = req.body;
    const adapterConfig: AdapterConfig =
      this.getAdapterConfigWithRuntimeParameters(datasource, runtimeParameters);

    const returnDataImportResponse =
      await AdapterService.getInstance().executeJob(adapterConfig);

    /* Const latestImport: unknown =
      await dataImportRepository.getLatestMetaDataImportByDatasourceId(id);*/
    // TODO id..
    const insertStatement: DataImportInsertStatement = {
      id: 667,
      data: returnDataImportResponse,
      error_messages: [],
      health: 'OK',
      timestamp: new Date(Date.now()).toLocaleString(),
      datasource_id: id,
    };
    const dataImport: unknown = await dataImportRepository.addDataImport(
      insertStatement,
    );

    const routingKey = ADAPTER_AMQP_IMPORT_SUCCESS_TOPIC;
    await outboxRepository.publishToOutbox(
      returnDataImportResponse,
      routingKey,
    );
    res.status(200).send(dataImport);
  };

  private getAdapterConfigWithRuntimeParameters(
    datasource: unknown,
    runtimeParameters: unknown,
  ): AdapterConfig {
    const parameters: unknown = {
      ...datasource.protocol.parameters,
      ...runtimeParameters.parameters,
    };

    const protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(Protocol.HTTP),
      parameters: parameters,
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
    return adapterConfig;
  }

  /*
    Helper function to retrieve format from user-provided input
  */
  static getFormat(type: string): string {
    switch (type) {
      case 'JSON': {
        return 'JSON';
      }
      case 'CSV': {
        return 'CSV';
      }
      case 'XML': {
        return 'XML';
      }
      default: {
        throw new Error('Format not found');
      }
    }
  }

  /*
  Helper function to retrieve protocol from user-provided input
  */
  static getProtocol(type: string): string {
    switch (type) {
      case 'HTTP': {
        return 'HTTP';
      }
      default: {
        throw new Error('Protocol not found');
      }
    }
  }
}

// TODO check datasource return values for exact matching
// TODO replace routing keys with environment variables
// TODO Error Handling general here when datasource == null
