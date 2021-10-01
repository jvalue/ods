export default interface DatasourceConfig {
  id: number;
  trigger: DatasourceTrigger;
}

export interface DatasourceTrigger {
  periodic: boolean;
  firstExecution: Date;
  interval: number;
}
