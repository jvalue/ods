export default interface Datasource {
  id: number;
  format: {
    type: string;
    parameters: object;
  };
  protocol: {
    type: string;
    parameters: object;
  };
  metadata: DatasourceMetaData;
  trigger: Trigger;
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

export type Data = object
