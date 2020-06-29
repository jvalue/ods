import JobResult from './job/jobResult'

export default interface TransformationService {
  getVersion(): string;
  executeJob(code: string, data: object): JobResult;
}
