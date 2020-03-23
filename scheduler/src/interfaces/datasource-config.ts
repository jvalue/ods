export default interface DatasourceConfig {
  id: number;
  protocol: DatasourceProtocol;
  format: DatasourceFormat;
  trigger: DatasourceTrigger;
  metadata: Object;
}

export interface DatasourceProtocol {
  type: String,
  parameters: {
    location?: String
  }
}

export interface DatasourceFormat {
  type: String,
  parameters: object
}

export interface DatasourceTrigger {
  periodic: boolean;
  firstExecution: Date;
  interval: number;
}
