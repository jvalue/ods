import express from 'express';

import { AdapterService } from '../../adapterService';
import { Format } from '../../Format';
import { Protocol } from '../../importer';
import { Importer } from '../../importer/Importer';
import { Interpreter } from '../../interpreter/Interpreter';
import {
  AdapterConfig,
  AdapterConfigValidator,
} from '../../model/AdapterConfig';
import { ImporterParameterError } from '../../model/exceptions/ImporterParameterError';
import { FormatConfig } from '../../model/FormatConfig';
import {
  ProtocolConfig,
  ProtocolConfigValidator,
} from '../../model/ProtocolConfig';

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
    // TODO doesn't the body contain adapterConfig (at least old impl did)?!?! -> why create adapterconfig and not simply pass to executeJob?!?!?
    const validator = new AdapterConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    // Check protocol type
    let importer: Importer;
    try {
      importer = AdapterEndpoint.getProtocol(req.body.protocol.type);
    } catch (e) {
      res.status(400).send('Protocol not supported');
      return;
    }

    const protocolConfigObj: ProtocolConfig = {
      protocol: importer,
      parameters: req.body.protocol.parameters,
    };

    // Check format type
    let formatType: Interpreter;
    try {
      formatType = AdapterEndpoint.getFormat(req.body.format.type);
    } catch (e) {
      res.status(400).send('Format not supported');
      return;
    }

    const format = new Format(formatType);
    const formatConfigObj: FormatConfig = {
      format: format,
      parameters: req.body.format.parameters,
    };

    const adapterConfig: AdapterConfig = {
      protocolConfig: protocolConfigObj,
      formatConfig: formatConfigObj,
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
    const validator = new ProtocolConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    const protocolConfigObj: ProtocolConfig = {
      protocol: Protocol.HTTP,
      parameters: req.body.protocol.parameters,
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
