export default interface Datasource {
  id: number
  format: {
    type: string
    parameters: object
  }
  protocol: {
    type: string
    parameters: object
  }
  mode: Mode
  dataSchema: DataSchema
  metadata: DatasourceMetaData
  trigger: Trigger
}

export interface DatasourceMetaData {
  displayName: string
  description: string
  author: string
  license: string
}

export interface Trigger {
  periodic: boolean
  interval: number
  firstExecution: Date
}

export interface DataLocation {
  id: number
  location: string
}

export interface DataSchema {
  data: string
}

export enum Mode {
  NONE = 'NONE',
  FAST = 'FAST',
  DETAILED = 'DETAILED'
}

export type Data = object
