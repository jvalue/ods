export interface DataSourceTriggerEvent {
  datasourceId: number;
  runtimeParameters: RuntimeParameters;
}

export interface RuntimeParameters {
  parameters: Parameters;
}
// TODO: falsch, müsste Record <string, unknown> sein, und deserialized werden. (siehe Adapter)
interface Parameters {
  id: number;
}
