import { DataImportResponse } from '../../adapter/api/DataImportResponse.dto';
import { ErrorResponse } from '../api/ErrorResponse.dto';

export interface OutboxRepository {
  publishToOutbox: (routingKey: string, payload: unknown) => Promise<string>;

  publishImportTriggerResults: (
    routingKey: string,
    datasourceId: number,
    returnDataImportResponse: DataImportResponse,
  ) => Promise<string>;

  publishErrorImportTriggerResults: (
    routingKey: string,
    dataSourceId: number,
    returnErrorResponse: ErrorResponse,
  ) => Promise<string>;
}
