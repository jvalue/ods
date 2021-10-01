export interface TransformationRequest {
  func: string;
  data: Record<string, unknown>;
}

export interface JobResult {
  data?: Record<string, unknown>;
  error?: JobError;
  stats: Stats;
}

export interface JobError {
  name: string;
  message: string;
  lineNumber: number;
  position: number;
  stacktrace: string[];
}

interface Stats {
  durationInMilliSeconds: number;
  startTimestamp: number;
  endTimestamp: number;
}
