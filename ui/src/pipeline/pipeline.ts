export default interface Pipeline {
  id: number
  datasourceId: number
  metadata: PipelineMetaData
  transformation: TransformationConfig
}

export interface PipelineMetaData {
  displayName: string
  description: string
  author: string
  license: string
}

export interface TransformationConfig {
  func: string
}
