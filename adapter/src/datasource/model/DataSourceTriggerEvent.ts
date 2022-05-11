export interface DataSourceTriggerEvent {
  datasourceId: number;
  runtimeParameters: RuntimeParameters;
}

export interface RuntimeParameters {
  parameters: Parameters;
}
interface Parameters {
  id: number;
}
