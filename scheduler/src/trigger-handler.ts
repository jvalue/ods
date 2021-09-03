import { AxiosError } from 'axios';

import * as AdapterClient from './api/http/adapter-client';

export async function triggerDatasource(datasourceId: number, triggerRetries: number): Promise<void> {
  for (let i = 0; i < triggerRetries; i++) {
    try {
      await AdapterClient.triggerDatasource(datasourceId);
      console.log(`Datasource ${datasourceId} triggered.`);
      break;
      // Necessary due to error: "'Unknown' not assignable to type '{ isAxiosError: boolean | undefined }'" otherwise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (isAxiosError(error)) {
        handleAxiosError(error);
      }
      if (i === triggerRetries - 1) {
        // Last retry
        console.error(`Could not trigger datasource ${datasourceId}`);
        break;
      }
      console.info(`Triggering datasource failed - retrying (${i}/${triggerRetries})`);
    }
  }
}

function isAxiosError(error: { isAxiosError: boolean | undefined }): error is AxiosError {
  return !!error.isAxiosError;
}

function handleAxiosError(error: AxiosError): void {
  const baseMsg = 'Error during datasource triggering:';

  if (error.response !== undefined) {
    console.error(`${baseMsg} ${error.response.status}: `, error.response.data);
    return;
  }

  console.error(`${baseMsg}:`, error.message);
}
