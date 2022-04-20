import express from 'express';

import { Importer } from '../../importer/Importer';
import { Interpreter } from '../../interpreter/Interpreter';
import {
  AdapterConfig,
  AdapterConfigValidator,
} from '../../model/AdapterConfig';
import { Format } from '../../model/enum/Format';
import { Protocol } from '../../model/enum/Protocol';
import { ImporterParameterError } from '../../model/exceptions/ImporterParameterError';
import { FormatConfig } from '../../model/FormatConfig';
import {
  ProtocolConfig,
  ProtocolConfigValidator,
} from '../../model/ProtocolConfig';
import { AdapterService } from '../../services/adapterService';

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

  handleExecuteDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const validator = new AdapterConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    // Check protocol type
    let protocolType: Importer;
    try {
      protocolType = AdapterEndpoint.getProtocol(req.body.protocol.type);
    } catch (e) {
      res.status(400).send('Protocol not supported');
      return;
    }

    const protocolConfigObj: ProtocolConfig = {
      protocol: new Protocol(protocolType),
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

    // Check location (???)
    const format = new Format(formatType);
    const formatConfigObj: FormatConfig = {
      format: format,
      parameters: req.body.format.parameters,
    };

    const adapterConfig: AdapterConfig = {
      protocolConfig: protocolConfigObj,
      formatConfig: formatConfigObj,
    };
    console.log(adapterConfig);

    let returnDataImportResponse = null;
    try {
      returnDataImportResponse = await AdapterService.getInstance().executeJob(
        adapterConfig,
      );
    } catch (e) {
      if (e instanceof ImporterParameterError) {
        res.status(400).send(e.message);
        return;
      }
    }

    res.status(200).send(returnDataImportResponse);
  };

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
      protocol: new Protocol(Protocol.HTTP),
      parameters: req.body.protocol.parameters,
    };
    const returnDataImportResponse =
      await AdapterService.getInstance().executeRawJob(protocolConfigObj);
    res.status(200).send(returnDataImportResponse);
  };

  /*
    Returns Collection of Importer
  } */

  handleGetFormat = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const interpreters = AdapterService.getInstance().getAllFormats();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(interpreters);
  };

  /*
    Returns Collection of Importer
  */
  handleGetProtocols = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    try {
      const protocols = AdapterService.getInstance().getAllProtocols();
      res.status(200).json(protocols);
    } catch (e) {
      res.status(500).send('Error finding protocols');
    }
  };

  handleGetApplicationVersion = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(APP_VERSION);
  };

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
        throw new Error('asdasd');
      }
    }
  }

  static getProtocol(type: string): Importer {
    switch (type) {
      case 'HTTP': {
        return Protocol.HTTP;
      }
      default: {
        throw new Error('asdasd');
      }
    }
  }
}
