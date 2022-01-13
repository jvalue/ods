import { Server } from 'http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

export const port = 8080;
const API_VERSION = '0.0.1';
export let server: Server | undefined;

// Await will be needed in the future, so for now ignore this linter issue and remove the disable
// eslint-disable-next-line @typescript-eslint/require-await
async function main(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req: express.Request, res: express.Response): void => {
    res.status(200).send('I am alive!');
  });

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
