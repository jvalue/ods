import { setTimeout as sleep } from 'timers/promises';

import DatasourceConfig from './api/datasource-config';
import { getAllDatasources } from './api/http/adapter-client';
import Scheduler from './scheduling';

export async function setupInitialStateWithRetry(
  scheduler: Scheduler,
  retries: number,
  backoff: number,
): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await setupInitialState(scheduler);
      return;
    } catch (e: any) {
      const error: { code: string | number } = e;
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.warn(`Failed to sync with Adapter Service on init (${retries}) . Retrying after ${backoff}ms... `);
      } else {
        console.warn(e);
        console.warn(`Retrying (${retries})...`);
      }
      await sleep(backoff);
    }
  }
  throw new Error('Failed to initialize datasource/pipeline scheduler.');
}

async function setupInitialState(scheduler: Scheduler): Promise<void> {
  console.log('Starting scheduler initialization');
  const datasources: DatasourceConfig[] = await getAllDatasources();
  console.log(`Received ${datasources.length} datasources from adapter-service`);
  for (const datasource of datasources) {
    datasource.trigger.firstExecution = new Date(datasource.trigger.firstExecution);
    scheduler.upsertJob(datasource); // Assuming adapter service checks for duplicates
  }
}
