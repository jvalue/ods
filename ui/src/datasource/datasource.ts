export default interface Datasource {
  id: number;
  format: {
    type: string;
    parameters: Record<string, unknown>;
  };
  protocol: {
    type: string;
    parameters: Record<string, unknown>;
  };
  schema?: Record<string, unknown>;
  metadata: DatasourceMetaData;
  trigger: Trigger;
}

export interface DataimportMetaData {
  id: number;
  health: HealthStatus;
  timestamp: string;
}

export interface DatasourceMetaData {
  displayName: string;
  description: string;
  author: string;
  license: string;
}

export interface Trigger {
  periodic: boolean;
  interval: number;
  firstExecution: Date;
}

export interface DataLocation {
  id: number;
  location: string;
}

export type Data = Record<string, unknown>;

export enum HealthStatus {
  OK = 'OK',
  WARINING = 'WARNING',
  FAILED = 'FAILED',
}
