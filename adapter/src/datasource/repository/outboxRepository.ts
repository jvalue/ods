import { DataImportResponse } from '../../adapter/model/DataImportResponse';
import { ErrorResponse } from '../services/ErrorResponse';

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
