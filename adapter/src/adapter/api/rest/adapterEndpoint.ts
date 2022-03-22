import express from 'express';
import { AdapterConfig, AdapterConfigValidator } from '../../model/AdapterConfig';


import { asyncHandler } from './utils';
import {ProtocolConfig, ProtocolConfigValidator} from "../../model/ProtocolConfig";
import { Format } from '../../model/enum/Format';
import { AdapterService } from '../../services/adapterService';

//const adapterService = require( "../../services/adapterService" );
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
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }

    let adapterConfig = req.params.config as unknown as AdapterConfig
    let returnDataImportResponse = AdapterService.getInstance().executeJob(adapterConfig);
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
