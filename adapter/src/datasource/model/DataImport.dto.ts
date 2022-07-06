import { KnexHelper } from '../repository/knexHelper';

import { DataImportEntity } from './DataImport.entity';

export interface DataImportDTO {
  id: number;
  error_messages: string[];
  health: string;
  timestamp: Date;
  data: string;
  parameters: Record<string, unknown>;
  location?: string;
}

export type DataImportMetaDataDTO = Omit<DataImportDTO, 'data' | 'parameters'>;

export type DataImportDataDTO = Pick<DataImportDTO, 'data' | 'location'>;

/* Export interface DataImportMetaDataDTO extends DataImportDTO {
  id: number;
  error_messages: string[];
  health: string;
  timestamp: Date;
  location?: string;
}

export interface DataImportDataDTO {
  data: unknown;
  location?: string;
}*/

export function dataimportEntityToDTO(
  data: DataImportEntity,
  location?: string,
): DataImportDTO {
  return {
    id: data.id,
    error_messages: data.error_messages,
    health: data.health,
    timestamp: data.timestamp,
    location: location,
    data: KnexHelper.stringFromUTF8Array(data.data) || '', // TODO error when null
    parameters: JSON.parse(data.parameters) as Record<string, unknown>,
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
): DataImportDataDTO {
  return {
    data: KnexHelper.stringFromUTF8Array(data.data) || '', // TODO error when null
    location: location,
  };
}
