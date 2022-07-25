import { DatasourceUtils } from '../datasourceUtils';
import { DataImportEntity } from '../model/DataImport.entity';

export interface DataImportDTO {
  id: number;
  error_messages: string[];
  health: string;
  timestamp: Date;
  data: string;
  parameters?: Record<string, unknown>;
  location?: string;
}

export type DataImportMetaDataDTO = Omit<DataImportDTO, 'data' | 'parameters'>;

export type DataImportDataDTO = Pick<
  DataImportDTO,
  'data' | 'location' | 'parameters'
>;

export function dataimportEntityToDTO(
  data: DataImportEntity,
  location?: string,
): DataImportDTO {
  const params =
    data.parameters !== ''
      ? (JSON.parse(data.parameters) as Record<string, unknown>)
      : {};
  return {
    id: data.id,
    error_messages: data.error_messages,
    health: data.health,
    timestamp: data.timestamp,
    location: location,
    data: DatasourceUtils.stringFromUTF8Array(data.data) ?? '', // TODO error when null
    parameters: params,
  };
}

export function dataImportEntityToMetaDataDTO(
  data: DataImportEntity,
  location?: string,
): DataImportMetaDataDTO {
  return {
    id: data.id,
    error_messages: data.error_messages,
    health: data.health,
    timestamp: data.timestamp,
    location: location,
  };
}

export function dataImportEntityToDataDTO(
  data: DataImportEntity,
  location?: string,
  parameters?: Record<string, unknown>,
): DataImportDataDTO {
  return {
    data: DatasourceUtils.stringFromUTF8Array(data.data) ?? '', // TODO error when null
    location: location,
    parameters: parameters,
  };
}
