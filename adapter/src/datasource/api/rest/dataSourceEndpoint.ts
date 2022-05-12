import express from 'express';

import { asyncHandler } from '../../../adapter/api/rest/utils';
import { ImporterParameterError } from '../../../adapter/model/exceptions/ImporterParameterError';
import {
  ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
  ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
} from '../../../env';
import { DatasourceConfigValidator } from '../../model/DatasourceConfigValidator';
import { DatasourceModelForAmqp } from '../../model/datasourceModelForAmqp';
import { DatasourceRepository } from '../../repository/datasourceRepository';
import { KnexHelper } from '../../repository/knexHelper';
import { OutboxRepository } from '../../repository/outboxRepository';
import {
  DataImportTriggerService,
  ErrorResponse,
} from '../../services/dataImportTriggerService';
import { DataSourceNotFoundException } from '../../services/dataSourceNotFoundException';
import { amqpHelper } from '../amqp/amqpHelper';

const datasourceRepository: DatasourceRepository = new DatasourceRepository();
const outboxRepository: OutboxRepository = new OutboxRepository();

export class DataSourceEndpoint {
  registerRoutes = (app: express.Application): void => {
    app.get('/testconsumer', asyncHandler(this.testConsumer));
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

  testConsumer = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    console.log(req);
    const msg = {
      datasourceId: '1',
    };
    await amqpHelper.publishAmqpMessage();

    res.status(200).send();
  };

  addDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const validator = new DatasourceConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    if (req.body.id) {
      res.status(400).send('Id not allowed');
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
    const datasource = await datasourceRepository.addDatasource(
      insertStatement,
    );
    const datasouceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };

    const routingKey = ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC;
    await outboxRepository.publishToOutbox(datasouceModelForAmqp, routingKey);
    res.header('location', req.headers.host + req.url + '/' + datasource.id);
    res.status(201).send(datasource);
  };

  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
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
    const datasource = await datasourceRepository.updateDatasource(
      insertStatement,
      req.params.datasourceId,
    );
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    await outboxRepository.publishToOutbox(
      datasourceModelForAmqp,
      ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
    );
    res.status(204).send(datasource);
  };

  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const id = req.params.datasourceId;
    let datasource: unknown;
    try {
      datasource = await datasourceRepository.getDataSourceById(id);
      await datasourceRepository.deleteDatasourceById(id);
    } catch {
      res.status(404).send('No datasource for id ' + id + ' found');
      return;
    }
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
  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const id = req.params.datasourceId;
    const runtimeParameters = req.body;

    const dataImportTriggerer: DataImportTriggerService =
      new DataImportTriggerService(id, runtimeParameters);
    try {
      const dataImport = await dataImportTriggerer.triggerImport(parseInt(id));
      res.status(200).send(dataImport);
    } catch (e) {
      if (e instanceof ImporterParameterError) {
        const msg: ErrorResponse = {
          error: 'URI is not absolute',
        };
        outboxRepository.publishError(
          Number(id),
          ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
          msg,
        );
        res.status(400).send(e);
        return;
      }
      if (e instanceof Error) {
        const msg: ErrorResponse = {
          error: '404 Not Found: [404 NOT FOUND Error]',
        };
        if (e.message.includes('Could not Fetch from URI:')) {
          outboxRepository.publishError(
            Number(id),
            ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
            msg,
          );
          res.status(500).send(e.message);
          return;
        }
        // 404 NOT_FOUND when trigger unknown datasources [POST /datasources/0/trigger]
        res.status(404).send(e.message);
        return;
      }
      if (e instanceof DataSourceNotFoundException) {
        res.status(404).send(e.message);
      } else {
        res.status(500).send(e);
      }
    }
  };

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
// TODO typisierung Datasource & Dataimport
