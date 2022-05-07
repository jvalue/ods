export interface DataSourceTriggerEvent {
  datasourceId:Number,
  runtimeParameters: RuntimeParameters
}

 export interface RuntimeParameters {
  parameters: Parameters
 }
 interface Parameters{
  id: number
 }
