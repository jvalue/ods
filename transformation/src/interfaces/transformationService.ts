import JobResult from './jobResult'

export default interface TransformationService {
  getVersion(): string;
  executeJob(code: string, data: object): JobResult;
}
