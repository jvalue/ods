export default interface JobError {
  name: string;
  message: string;
  lineNumber: number;
  position: number;
  stacktrace: string[];
}
