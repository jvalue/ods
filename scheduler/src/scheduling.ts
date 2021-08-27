import deepEqual from 'deep-equal';
import schedule from 'node-schedule';

import type DatasourceConfig from './api/datasource-config';
import { triggerDatasource } from './trigger-handler';

export default class Scheduler {
  private readonly allJobs: Map<number, SchedulingJob> = new Map(); // DatasourceId -> job

  constructor(private readonly triggerRetries: number) {}

  getJob(datasourceId: number): SchedulingJob | undefined {
    return this.allJobs.get(datasourceId);
  }

  getAllJobs(): SchedulingJob[] {
    return Array.from(this.allJobs.values());
  }

  removeJob(datasourceId: number): void {
    this.cancelJob(datasourceId);
    this.allJobs.delete(datasourceId);
  }

  removeAllJobs(): void {
    this.allJobs.forEach((job) => {
      schedule.cancelJob(job.scheduleJob);
    });
    this.allJobs.clear();
  }

  private cancelJob(jobId: number): void {
    const job = this.allJobs.get(jobId);
    job?.scheduleJob.cancel();
  }

  existsJob(datasourceId: number): boolean {
    return this.allJobs.has(datasourceId);
  }

  existsEqualJob(datasourceConfig: DatasourceConfig): boolean {
    const job = this.getJob(datasourceConfig.id);
    return job !== undefined && deepEqual(job.datasourceConfig, datasourceConfig);
  }

  determineExecutionDate(datasourceConfig: DatasourceConfig): Date {
    let executionDate = datasourceConfig.trigger.firstExecution.getTime();
    const now = Date.now();

    if (executionDate > now) {
      return datasourceConfig.trigger.firstExecution;
    }

    const offset = (now - executionDate) % datasourceConfig.trigger.interval;
    executionDate = now + datasourceConfig.trigger.interval - offset;
    return new Date(executionDate);
  }

  private scheduleDatasource(datasourceConfig: DatasourceConfig): SchedulingJob {
    const datasourceId = datasourceConfig.id;

    // Cancel current job for given datasource
    this.cancelJob(datasourceId);

    const executionDate: Date = this.determineExecutionDate(datasourceConfig);
    console.log(`datasource ${datasourceId} with consecutive pipelines scheduled
      for next execution at ${executionDate.toLocaleString()}.`);

    const scheduledJob = schedule.scheduleJob(`Datasource ${datasourceId}`, executionDate, () =>
      this.execute(datasourceConfig),
    );
    const datasourceJob = { scheduleJob: scheduledJob, datasourceConfig: datasourceConfig };
    this.allJobs.set(datasourceId, datasourceJob);

    return datasourceJob;
  }

  private execute(datasourceConfig: DatasourceConfig): void {
    const datasourceId = datasourceConfig.id;
    triggerDatasource(datasourceId, this.triggerRetries)
      .catch((error) => console.log('Failed to execute job:', error))
      .finally(() => this.reschedule(datasourceConfig));
  }

  reschedule(datasourceConfig: DatasourceConfig): void {
    if (datasourceConfig.trigger.periodic) {
      this.scheduleDatasource(datasourceConfig);
    } else {
      console.log(`Datasource ${datasourceConfig.id} is not periodic. Removing it from scheduling.`);
      this.removeJob(datasourceConfig.id);
      console.log(`Successfully removed datasource ${datasourceConfig.id} from scheduling.`);
    }
  }

  upsertJob(datasourceConfig: DatasourceConfig): SchedulingJob {
    const isNewDatasource = !this.existsJob(datasourceConfig.id);
    const datasourceState = isNewDatasource ? 'New' : 'Updated';

    console.log(`[${datasourceState}] datasource detected with id ${datasourceConfig.id}.`);

    return this.scheduleDatasource(datasourceConfig);
  }
}

interface SchedulingJob {
  scheduleJob: schedule.Job;
  datasourceConfig: DatasourceConfig;
}
