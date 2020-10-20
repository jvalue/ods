export interface TransformationRequest {
  func: string
  data: object
}

export interface JobResult {
  data?: object
  error?: JobError
  stats: Stats
}

export interface JobError {
  name: string
  message: string
  lineNumber: number
  position: number
  stacktrace: string[]
}

interface Stats {
  durationInMilliSeconds: number
  startTimestamp: number
  endTimestamp: number
}
