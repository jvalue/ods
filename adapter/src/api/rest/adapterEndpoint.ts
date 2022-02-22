import express from 'express';
import { AdapterConfigValidator } from '../../model/AdapterConfig';

import { asyncHandler } from './utils';

const adapterService = require( "../../services/AdapterService" );
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
    // TODO check if valid config
    const validator = new AdapterConfigValidator();
    if (!validator.validate(req.body)) {
      res.status(400).json({ errors: validator.getErrors() });
      return;
    }

    let adapterConfig = req.params.config
    let returnDataImportResponse = adapterService.executeJob(adapterConfig);
    res.status(200).send(returnDataImportResponse);
  };

  handleExecuteRawPreview = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    // TODO check if valid config
    let protocolConfig = req.params.config
    let returnDataImportResponse = adapterService.executeRawImport(protocolConfig);
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
      let interpreters = adapterService.getAllFormats();
      res.status(200).json(interpreters);
    } catch (e) {
      res.status(500).send('Error finding formats');
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
          let protocols = adapterService.getAllProtocols();
          res.status(200).json(protocols);
        } catch (e) {
          res.status(500).send('Error finding protocols');
        }
  };

  handleGetApplicationVersion = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    res.status(200).send(APP_VERSION);
  };
};
