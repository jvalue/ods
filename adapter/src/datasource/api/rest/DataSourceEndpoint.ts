import express from 'express';

import { asyncHandler } from '../../../adapter/api/rest/utils';
import { ImporterParameterError } from '../../../adapter/exceptions/ImporterParameterError';
import {
  ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC,
  ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
  ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
} from '../../../env';
import { DataImportTriggerService } from '../../DataImportTriggerService';
import { DataSourceNotFoundException } from '../../exceptions/DataSourceNotFoundException';
import { DatasourceEntity } from '../../repository/Datasource.entity';
import { DatasourceRepository } from '../../repository/DatasourceRepository';
import { OutboxRepository } from '../../repository/OutboxRepository';
import { DatasourceUtils } from '../../utils';
import { datasourceEntityToDTO } from '../Datasource.dto';
import { DatasourceModelForAmqp } from '../DatasourceAMQP.dto';
import { DatasourceConfigValidator } from '../DatasourceConfig.dto';
import { ErrorResponse } from '../ErrorResponse.dto';

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
    let datasourceId;
    try {
      datasourceId = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('datasourceId has to be an integer!');
      return;
    }
    const datasource = await this.datasourceRepository.getById(datasourceId);
    if (!this.validateEntity(datasource)) {
      res.status(404).send(`Datasource with ${datasourceId} not found!`);
      return;
    }
    res.status(200).send(datasourceEntityToDTO(datasource));
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
    const insertStatement =
      DatasourceUtils.getInsertStatementForDataSource(req);
    const datasource = await this.datasourceRepository.create(insertStatement);

    const datasourceDTO = datasourceEntityToDTO(datasource);
    const datasouceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasourceDTO,
    };
    const routingKey = ADAPTER_AMQP_DATASOURCE_CREATED_TOPIC;
    await this.outboxRepository.publishToOutbox(
      routingKey,
      datasouceModelForAmqp,
    );
    const dataSourceId: number = datasource.id;
    const reqHost: string | undefined = req.headers.host;
    const reqUrl: string = req.url;
    if (reqHost === undefined) {
      res.status(400).send('No host for request available');
      return;
    }
    res.header('location', `${reqHost}${reqUrl}/${dataSourceId}`);
    res.status(201).send(datasourceDTO);
  };

  updateDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let datasourceId;
    try {
      datasourceId = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('datasourceId has to be an integer!');
      return;
    }
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
    const insertStatement =
      DatasourceUtils.getInsertStatementForDataSource(req);
    const datasource = await this.datasourceRepository.update(
      datasourceId,
      insertStatement,
    );
    const datasourceDTO = datasourceEntityToDTO(datasource);
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasourceDTO,
    };
    await this.outboxRepository.publishToOutbox(
      ADAPTER_AMQP_DATASOURCE_UPDATED_TOPIC,
      datasourceModelForAmqp,
    );
    res.status(204).send(datasourceDTO);
  };

  deleteDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let id;
    try {
      id = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('datasourceId has to be an integer!');
      return;
    }
    const datasource = await this.datasourceRepository.getById(id);
    if (datasource === undefined) {
      res.status(404).send(`No datasource for id ${id} found`);
      return;
    }
    await this.datasourceRepository.delete(id);
    const datasourceDTO = datasourceEntityToDTO(datasource);
    const datasourceModelForAmqp: DatasourceModelForAmqp = {
      datasource: datasourceDTO,
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
    const routingKey = ADAPTER_AMQP_DATASOURCE_DELETED_TOPIC;
    datasourcesToDelete.forEach((dataSourceDeleted) => {
      const datasourceModelForAmqp: DatasourceModelForAmqp = {
        datasource: dataSourceDeleted,
      };
      void this.outboxRepository.publishToOutbox(
        routingKey,
        datasourceModelForAmqp,
      );
    });
    res.status(204).send();
  };
  triggerDataImportForDatasource = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let id;
    try {
      id = Number.parseInt(req.params.datasourceId, 10);
    } catch (e) {
      res.status(400).send('id has to be an integer!');
      return;
    }
    const runtimeParameters: Record<string, unknown> = req.body as Record<
      string,
      unknown
    >;

    try {
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
    if (result === undefined) {
      return false;
    }
    return true;
  }
}
