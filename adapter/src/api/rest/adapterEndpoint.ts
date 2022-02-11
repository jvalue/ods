import express from 'express';

import { asyncHandler } from './utils';

const adapterService = require( "../../services/AdapterService" );

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
    res.status(200).send();
  };

  handleExecuteRawPreview = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    res.status(200).send();
  };

  // Format Endpoint
  /*
    @RestController
  @AllArgsConstructor
  public class FormatEndpoint {
    private final Adapter adapter;

    @GetMapping(Mappings.FORMAT_PATH)
    public Collection<Interpreter> getFormats() {
      return adapter.getAllFormats();
    }
  } */

  handleGetFormat = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    let interpreters = adapterService.getAllFormats();
    res.status(200).json(interpreters);
  };

  // Protocol Endpoint
  /*
    @RestController
    @AllArgsConstructor
  public class ProtocolEndpoint {
    private final Adapter adapter;

    @GetMapping(Mappings.PROTOCOL_PATH)
    public Collection<Importer> getProtocols() {
      return adapter.getAllProtocols();
    }
  }
  */
  // Version Endpoint

  handleGetProtocols = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    res.status(200).send();
  };
  /*
  @RestController
  public class VersionEndpoint {

    @Value("${app.version}")
    private String VERSION;

    @GetMapping(Mappings.VERSION_PATH)
    public String getApplicationVersion() {
      return VERSION;
    }
  }
  */
  handleGetApplicationVersion = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    res.status(200).send();
  };
};