import { Server } from 'http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

export const port = 8080;
const API_VERSION = '0.0.1';
export let server: Server | undefined;

// Await will be needed in the future, so for now ignore this linter issue and remove the disable later
// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!');
  });

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
  app.post('/preview', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(API_VERSION);
  });

  app.post('/preview/raw', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(API_VERSION);
  });

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
  app.get('/formats', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(API_VERSION);
  });

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
  app.get('/protocols', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(API_VERSION);
  });

  // Version Endpoint
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
  app.get('/version', (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain');
    res.status(200).send(API_VERSION);
  });


  server = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error(`Failed to start adapter service: `, error);
});
