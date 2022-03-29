import express from 'express';
import { AdapterConfig, AdapterConfigValidator } from '../../model/AdapterConfig';


import { asyncHandler } from './utils';
import {ProtocolConfig, ProtocolConfigValidator} from "../../model/ProtocolConfig";
import { Format } from '../../model/enum/Format';
import { AdapterService, adapterService } from '../../services/adapterService';
import { FormatConfig } from '../../model/FormatConfig';
import { Protocol } from '../../model/enum/Protocol';


const APP_VERSION = "0.0.1"
export class AdapterEndpoint {
  constructor() {}

  registerRoutes = (app: express.Application): void => {
    app.post('/preview', asyncHandler(this.handleExecuteDataImport));
    app.post('/preview/raw', asyncHandler(this.handleExecuteRawPreview));
    app.get('/formats', asyncHandler(this.handleGetFormat));
    app.get('/protocols', asyncHandler(this.handleGetProtocols));
    app.get('/version', asyncHandler(this.handleGetApplicationVersion));
  };

  // Adapter Endpoint
  /**
     * @RestController
  @AllArgsConstructor
  public class AdapterEndpoint {
    private final Adapter adapter;

    @PostMapping(Mappings.IMPORT_PATH)
    public DataImportResponse executeDataImport(@Valid @RequestBody AdapterConfig config)
        throws ImporterParameterException, InterpreterParameterException, IOException {
      return adapter.executeJob(config);
    }

    @PostMapping(Mappings.RAW_IMPORT_PATH)
    public DataImportResponse executeRawPreview(@Valid @RequestBody ProtocolConfig config)
        throws ImporterParameterException {
      return adapter.executeRawImport(config);
    }
  }
   */

  handleExecuteDataImport = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const validator = new AdapterConfigValidator();
    const adapterconfigforValidator = req.body;
    if (!validator.validate(adapterconfigforValidator)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }

    let protocolConfigObj: ProtocolConfig = {protocol: new Protocol(Protocol.HTTP), parameters: req.body.protocol.parameters}
    let format = new Format(AdapterEndpoint.getFormat(req.body.format.type))
    let formatConfigObj: FormatConfig = {format: format, parameters: req.body.format.parameters}

    let adapterConfig:AdapterConfig = {protocolConfig: protocolConfigObj, formatConfig: formatConfigObj}
    console.log(adapterConfig)
    let returnDataImportResponse = AdapterService.getInstance().executeJob(adapterConfig);
    res.status(200).send(returnDataImportResponse);
  };

  static getFormat(type: any): any {
    switch(type) {
      case "JSON": {
         return Format.JSON;
      }
      case "CSV": {
         return Format.CSV;
      }
      case "XML": {
        return Format.XML;
     }
      default: {
         throw Error();
      }
   }
  }

  handleExecuteRawPreview = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const validator = new ProtocolConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }
    let protocolConfig = req.params.config as unknown as ProtocolConfig
    let returnDataImportResponse = AdapterService.getInstance().executeRawJob(protocolConfig);
    res.status(200).send(returnDataImportResponse);
  };

  /*
    returns Collection of Importer
  } */

  handleGetFormat = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    try {
      let interpreters = AdapterService.getInstance().getAllFormats();
      res.setHeader("Content-Type", "application/json")
      res.status(200).json(interpreters);
    } catch (e) {
      //res.status(500).send('Error finding formats');
      throw e
    }
  };

  /*
    returns Collection of Importer
  */
  handleGetProtocols = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    try {
          let protocols = AdapterService.getInstance().getAllProtocols();
          res.status(200).json(protocols);
        } catch (e) {
          res.status(500).send('Error finding protocols');
        }
  };

  handleGetApplicationVersion = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(APP_VERSION);
  };


};


