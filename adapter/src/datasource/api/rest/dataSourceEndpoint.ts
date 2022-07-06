import express from 'express';

import { asyncHandler } from '../../../adapter/api/rest/utils';
import { ImporterParameterError } from '../../../adapter/model/exceptions/ImporterParameterError';
import {
  ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
  ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
} from '../../../env';
import { datasourceEntityToDTO } from '../../model/Datasource.dto';
import { DatasourceEntity } from '../../model/Datasource.entity';
import { DatasourceConfigValidator } from '../../model/DatasourceConfigValidator';
import { DatasourceModelForAmqp } from '../../model/datasourceModelForAmqp';
import { DatasourceRepository } from '../../repository/datasourceRepository';
import { KnexHelper } from '../../repository/knexHelper';
import { OutboxRepository } from '../../repository/outboxRepository';
import { DataImportTriggerService } from '../../services/dataImportTriggerService';
import { DataSourceNotFoundException } from '../../services/dataSourceNotFoundException';
import { ErrorResponse } from '../../services/ErrorResponse';

export class DataSourceEndpoint {
  constructor(
    private readonly datasourceRepository: DatasourceRepository,
    private readonly outboxRepository: OutboxRepository,
    private readonly dataImportTriggerService: DataImportTriggerService,
  ) {}

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
    const datasource = await this.datasourceRepository.getAll();
    const datasourceDTOs = datasource.map((el: DatasourceEntity) =>
      datasourceEntityToDTO(el),
    );
    res.status(200).send(datasourceDTOs);
  };

  getDataSource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO assert int
    const datasourceId = Number.parseInt(req.params.datasourceId, 10);
    const datasource = await this.datasourceRepository.getById(datasourceId);
    if (!this.validateEntity(datasource)) {
      res.status(404).send(`Datasource with ${datasourceId} not found!`);
      return;
    }
    res.status(200).send(datasourceEntityToDTO(datasource));
  };
  // TODO only for test purposes
  /* TestConsumer = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    console.log(req);
    const msg = {
      datasourceId: '1',
    };
    AmqpHelper.publishAmqpMessage();

    res.status(200).send();
  };*/

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
    const datasource = await this.datasourceRepository.create(insertStatement);
    const datasouceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };

    const routingKey = ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC;
    await this.outboxRepository.publishToOutbox(
      routingKey,
      datasouceModelForAmqp,
    );
    const dataSourceId: number = datasource.id;
    const reqHost: string | undefined = req.headers.host;
    const reqUrl: string = req.url;
    if (!reqHost) {
      res.status(400).send('No host for request available');
    }
    // Gets checked in line 113
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    res.header('location', reqHost + reqUrl + '/' + dataSourceId.toString());
    res.status(201).send(datasource);
  };

  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO assert int
    const datasourceId = Number.parseInt(req.params.datasourceId, 10);
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
    const datasource = await this.datasourceRepository.update(
      datasourceId,
      insertStatement,
    );
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    await this.outboxRepository.publishToOutbox(
      ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
      datasourceModelForAmqp,
    );
    res.status(204).send(datasource);
  };

  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO assert int
    const id = Number.parseInt(req.params.datasourceId, 10);
    let datasource: unknown;
    try {
      datasource = await this.datasourceRepository.getById(id);
      await this.datasourceRepository.delete(id);
    } catch {
      res.status(404).send(`No datasource for id ${id} found`);
      return;
    }
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasource,
    };
    const routingKey = ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC;
    await this.outboxRepository.publishToOutbox(
      routingKey,
      datasourceModelForAmqp,
    );
    res.status(204).send();
  };

  deleteAllDatasources = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const datasourcesToDelete = await this.datasourceRepository.getAll();
    await this.datasourceRepository.deleteAll();
    // Const routingKey = 'datasource.config.deleted';
    const routingKey = ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC;
    // TODO fix wrong entry in outbox database
    datasourcesToDelete.forEach((dataSourceDeleted) => {
      const datasourceModelForAmqp: DatasourceModelForAmqp = {
        datasource: dataSourceDeleted,
      };
      void this.outboxRepository.publishToOutbox(
        routingKey,
        datasourceModelForAmqp,
      );
    });
    /* TODO check if replacementfrom 188-193 is correct
    for (const dataSourceDeleted in datasourcesToDelete) {
      const datasourceModelForAmqp: DatasourceModelForAmqp = {
        datasource: datasourcesToDelete[dataSourceDeleted],
      };
      await outboxRepository.publishToOutbox(
        datasourceModelForAmqp,
        routingKey,
      );
    }*/
    res.status(204).send();
  };
  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO assert int
    const id = Number.parseInt(req.params.datasourceId, 10);
    const runtimeParameters: Record<string, unknown> = req.body as Record<
      string,
      unknown
    >;

    try {
      // TODO types
      const dataImport = await this.dataImportTriggerService.triggerImport(
        id,
        runtimeParameters,
      );
      res.status(200).send(dataImport);
    } catch (e) {
      if (e instanceof ImporterParameterError) {
        const msg: ErrorResponse = {
          error: 'URI is not absolute',
        };
        void this.outboxRepository.publishErrorImportTriggerResults(
          ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
          Number(id),
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
          void this.outboxRepository.publishErrorImportTriggerResults(
            ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
            Number(id),
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

  private validateEntity(result: unknown): result is DatasourceEntity {
    if (!result || result === undefined) {
      return false;
    }
    return true;
  }
}

// TODO check datasource return values for exact matching
// TODO replace routing keys with environment variables
// TODO Error Handling general here when datasource == null
// TODO typisierung Datasource & Dataimport
