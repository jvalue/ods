import { VM, VMScript } from 'vm2';

import { ExecutionResult } from './executionResult';
import SandboxExecutor from './sandboxExecutor';
import { convertRuntimeError, convertSyntaxError } from './vm2StacktraceParser';

const FUNCTION_WRAP_PREFIX_LENGTH = 1;

export default class VM2SandboxExecutor implements SandboxExecutor {
  vm: VM;

  constructor(timeout = 5000) {
    this.vm = new VM({
      timeout,
    });
  }

  private assertIsObjectOrArray(data: Record<string, unknown>): void {
    if (!(typeof data === 'object')) {
      throw new TypeError('given data is no object or array');
    }
  }

  execute(code: string, data: Record<string, unknown>): ExecutionResult {
    this.assertIsObjectOrArray(data);

    const json = JSON.stringify(data);

    const script = new VMScript(code, 'main');
    script.wrap('function main(data) {\n', `\n}\nmain(${json});`);

    try {
      script.compile();
    } catch (err) {
      const error = err as Error;
      return { error: convertSyntaxError(error, FUNCTION_WRAP_PREFIX_LENGTH) };
    }

    try {
      const result = this.vm.run(script) as Record<string, unknown>;
      return { data: result };
    } catch (err) {
      const error = err as Error;
      return { error: convertRuntimeError(error, FUNCTION_WRAP_PREFIX_LENGTH) };
    }
  }
}
