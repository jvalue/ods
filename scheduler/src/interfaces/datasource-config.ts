export default interface DatasourceConfig {
  id: number
  protocol: DatasourceProtocol
  format: object
  trigger: DatasourceTrigger
  metadata: object
}

export interface DatasourceProtocol {
  type: string
  parameters: {
    location?: string
  }
}

export interface DatasourceTrigger {
  periodic: boolean
  firstExecution: Date
  interval: number
}
