import path from 'path';

import { readEnvOrDie } from '@jvalue/node-dry-basics';
import { PostgresClient } from '@jvalue/node-dry-pg';
import { Verifier } from '@pact-foundation/pact';
import { PoolConfig } from 'pg';

import {
  CONNECTION_BACKOFF,
  CONNECTION_RETRIES,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_PW,
  POSTGRES_SCHEMA,
  POSTGRES_SSL,
  POSTGRES_USER,
} from './env';
import { PostgresStorageContentRepository } from './storage-content/postgresStorageContentRepository';
import { InsertStorageContent } from './storage-content/storageContentRepository';
import { PostgresStorageStructureRepository } from './storage-structure/postgresStorageStructureRepository';

const POSTGREST_URL = readEnvOrDie('POSTGREST_URL');
const POSTGREST_PORT = process.env.POSTGREST_PORT ?? 3000;

const poolConfig: PoolConfig = {
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PW,
  database: POSTGRES_DB,
  ssl: POSTGRES_SSL,
};

const postgresClient = new PostgresClient(poolConfig);
const storageContentRepository = new PostgresStorageContentRepository(
  postgresClient,
);
const storageStructureRepository = new PostgresStorageStructureRepository(
  postgresClient,
);

// Stores the identifiers of tables that are present in the database
const presentTables: string[] = [];

describe('Pact Provider Verification', () => {
  beforeAll(async () => {
    await postgresClient.waitForConnection(
      CONNECTION_RETRIES,
      CONNECTION_BACKOFF,
    );

    await queryPresentTables();
  });

  it('validates the expectations of the UI', async () => {
    const verifier = new Verifier({
      provider: 'Storage',
      providerBaseUrl: `http://${POSTGREST_URL}:${POSTGREST_PORT}`,
      pactUrls: [
        path.resolve(process.cwd(), '..', '..', 'pacts', 'ui-storage.json'),
      ],
      logDir: path.resolve(process.cwd(), '..', '..', 'pacts', 'logs'),
      stateHandlers: {
        'any state': setupEmptyState,
        'pipeline with id 1 and some stored items exists':
          setupFilledPipelineTable,
        'pipeline with id 1 and no stored items exists':
          setupEmptyPipelineTable,
        'pipeline with id 1 does not exist': setupEmptyState,
        'pipeline with id 1 and a stored item with id 2 exists':
          setupFilledPipelineTable,
      },
    });
    await verifier.verifyProvider();
  });

  afterAll(async () => {
    await postgresClient.close();
  });
});

// Initializes the presentTables array with the identifiers of all tables that are present in the database
async function queryPresentTables(): Promise<void> {
  await postgresClient.transaction(async () => {
    const result = await postgresClient.executeQuery(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${POSTGRES_SCHEMA}'`,
    );
    for (const row of result.rows) {
      Object.values(row).forEach((value) => {
        presentTables.push(value as string);
      });
    }
  });
}

async function setupEmptyState(): Promise<void> {
  await clearState();
}

async function setupEmptyPipelineTable(): Promise<void> {
  await clearState();
  await createPipelineTable(1);
}

async function setupFilledPipelineTable(): Promise<void> {
  await clearState();
  await createPipelineTable(1);
  await addSampleItemToPipelineTable(1); // Adds an item with item id 1
  await addSampleItemToPipelineTable(1); // Adds an item with item id 2
}

async function clearState(): Promise<void> {
  for (const tableIdentifier of presentTables) {
    await storageStructureRepository.delete(tableIdentifier);
  }
  presentTables.splice(0, presentTables.length);
}

async function createPipelineTable(pipelineId: number): Promise<void> {
  const pipelineTableIdentifier = pipelineId.toString();
  await storageStructureRepository.create(pipelineTableIdentifier);
  presentTables.push(pipelineTableIdentifier);
}

const sampleItem: InsertStorageContent = {
  pipelineId: 42,
  timestamp: new Date(2020, 2, 29),
  data: { just: 'some', sample: 'data' },
};

async function addSampleItemToPipelineTable(pipelineId: number): Promise<void> {
  const pipelineTableIdentifier = pipelineId.toString();
  await storageContentRepository.saveContent(
    pipelineTableIdentifier,
    sampleItem,
  );
}
