import { JobResult } from './jobResult';
import { ExecutionResult } from './sandbox/executionResult';
import SandboxExecutor from './sandbox/sandboxExecutor';
import Stats from './stats';

const VERSION = '0.0.2';

export default class PipelineExecutor {
  constructor(private readonly executor: SandboxExecutor) {}

  getVersion(): string {
    return VERSION;
  }

  private executionTimeInMillis(func: () => ExecutionResult): [number, ExecutionResult] {
    const start = process.hrtime();
    const result = func();
    const hrresult = process.hrtime(start);
    const time = hrresult[0] * 1e3 + hrresult[1] / 1e6;
    return [time, result];
  }

  executeJob(code: string, data: Record<string, unknown>): JobResult {
    const startTimestamp = Date.now();

    const [time, result] = this.executionTimeInMillis(() => this.executor.execute(code, data));

    const endTimestamp = Date.now();

    const stats: Stats = {
      durationInMilliSeconds: time,
      startTimestamp,
      endTimestamp,
    };

    if ('error' in result) {
      return { error: result.error, stats };
    }

    if (result.data === undefined || result.data == null) {
      return {
        error: {
          name: 'MissingReturnError',
          message: 'Code snippet is not returning valid data',
          lineNumber: 0,
          position: 0,
          stacktrace: [],
        },
        stats,
      };
    }

    return { data: result.data, stats };
  }
}
