export interface StorageContent {
  id: number
  pipelineId: string

  timestamp: Date
  origin: string
  license: string

  data: object
}
