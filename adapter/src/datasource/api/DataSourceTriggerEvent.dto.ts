export interface DataSourceTriggerEvent {
  datasourceId: number;
  runtimeParameters: Record<string, unknown>;
}
