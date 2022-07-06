export interface DataImportEntity {
  id: number;
  error_messages: string[];
  health: string;
  timestamp: Date;
  datasource_id: number;
  data: Uint8Array;
  parameters: string;
}
