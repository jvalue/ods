import express from 'express';

import { AdapterConfig, ProtocolConfig } from '../../AdapterConfig';
import { AdapterService } from '../../adapterService';
import { ImporterParameterError } from '../../exceptions/ImporterParameterError';
import { Importer, Protocol } from '../../importer';
import { Format, Interpreter } from '../../interpreter';
import {
  AdapterConfigValidator,
  ProtocolConfigValidator,
} from '../AdapterConfig.dto';

import { asyncHandler } from './utils';

const APP_VERSION = '0.0.1';
export class AdapterEndpoint {
  registerRoutes = (app: express.Application): void => {
    app.post('/preview', asyncHandler(this.handleExecuteDataImport));
    app.post('/preview/raw', asyncHandler(this.handleExecuteRawPreview));
    app.get('/formats', asyncHandler(this.handleGetFormat));
    app.get('/protocols', asyncHandler(this.handleGetProtocols));
    app.get('/version', asyncHandler(this.handleGetApplicationVersion));
  };

  /**
   * Endpoint for /preview
   * Validates adapter configuration. Retrieves Protocol and Format from HTTP body.
   * Executes the provided protocol and format.
   * If an error in validation or in HTTP GET occurs, Status code 400 is retransmitted.
   * If the server for the HTTP request returns status Code 404 - Status code 500 is retransmitted
   *
   * @param req HTTP request containing adapter configuration in body
   * @param res HTTP response
   * @returns Promise<void>
   */
  handleExecuteDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const adapterConfigRequest: unknown = req.body;
    const validator = new AdapterConfigValidator();
    if (!validator.validate(adapterConfigRequest)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    // Check protocol type
    let importer: Importer;
    try {
      importer = AdapterEndpoint.getProtocol(
        adapterConfigRequest.protocol.type,
      );
    } catch (e) {
      res.status(400).send('Protocol not supported');
      return;
    }

    // Check format type
    let interpreter: Interpreter;
    try {
      interpreter = AdapterEndpoint.getFormat(adapterConfigRequest.format.type);
    } catch (e) {
      res.status(400).send('Format not supported');
      return;
    }

    const adapterConfig: AdapterConfig = {
      protocolConfig: {
        protocol: importer,
        parameters: adapterConfigRequest.protocol.parameters,
      },
      formatConfig: {
        format: interpreter,
        parameters: adapterConfigRequest.format.parameters,
      },
    };

    try {
      const returnDataImportResponse =
        await AdapterService.getInstance().executeJob(adapterConfig);
      res.status(200).send(returnDataImportResponse);
    } catch (e) {
      if (e instanceof ImporterParameterError) {
        res.status(400).send(e.message);
        return;
      }
      if (e instanceof Error) {
        res.status(500).send(e.message);
      }
    }
  };

  /**
   * Endpoint for /preview/raw
   * Validates adapter configuration. Retrieves Protocol
   * Executes the provided protocol
   * If an error in validation or in HTTP GET occurs, Status code 400 is retransmitted.
   * If the server for the HTTP request returns status Code 404 - Status code 500 is retransmitted
   *
   * @param req HTTP request containing adapter configuration in body
   * @param res HTTP response
   * @returns Promise<void>
   */
  handleExecuteRawPreview = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const protocolConfigRequest: unknown = req.body;
    const validator = new ProtocolConfigValidator();
    if (!validator.validate(protocolConfigRequest)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    const protocolConfigObj: ProtocolConfig = {
      protocol: Protocol.HTTP,
      parameters: protocolConfigRequest.parameters,
    };
    try {
      const returnDataImportResponse =
        await AdapterService.getInstance().executeRawJob(protocolConfigObj);
      res.status(200).send(returnDataImportResponse);
    } catch (e) {
      if (e instanceof ImporterParameterError) {
        res.status(400).send(e.message);
        return;
      }
      if (e instanceof Error) {
        res.status(500).send(e.message);
      }
    }
  };

  /*
    Returns Collection of Interpreter
  */
  handleGetFormat = (req: express.Request, res: express.Response): void => {
    const interpreters = AdapterService.getInstance().getAllFormats();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(interpreters);
  };

  /*
    Returns Collection of Importer
  */
  handleGetProtocols = (req: express.Request, res: express.Response): void => {
    try {
      const protocols = AdapterService.getInstance().getAllProtocols();
      res.status(200).json(protocols);
    } catch (e) {
      res.status(500).send('Error finding protocols');
    }
  };

  /*
    Returns Application Version
  */
  handleGetApplicationVersion = (
    req: express.Request,
    res: express.Response,
  ): void => {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(APP_VERSION);
  };

  /*
    Helper function to retrieve format from user-provided input
  */
  static getFormat(type: string): Interpreter {
    switch (type) {
      case 'JSON': {
        return Format.JSON;
      }
      case 'CSV': {
        return Format.CSV;
      }
      case 'XML': {
        return Format.XML;
      }
      default: {
        throw new Error('Format not found');
      }
    }
  }

  /*
    Helper function to retrieve protocol from user-provided input
  */
  static getProtocol(type: string): Importer {
    switch (type) {
      case 'HTTP': {
        return Protocol.HTTP;
      }
      default: {
        throw new Error('Protocol not found');
      }
    }
  }
}
