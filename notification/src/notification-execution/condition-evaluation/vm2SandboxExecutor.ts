import { VM } from 'vm2';

import SandboxExecutor from './sandboxExecutor';

export default class VM2SandboxExecutor implements SandboxExecutor {
  vm: VM;

  constructor(timeout = 5000) {
    this.vm = new VM({
      timeout,
    });
  }

  evaluate(expression: string, data?: Record<string, unknown>): boolean {
    console.log(`Evaluating expression: "${expression}" on data`);
    const wrapper =
      'f=function(data){' +
      'return ' +
      expression +
      '};f(' +
      JSON.stringify(data) +
      ');';

    let result: unknown;
    try {
      result = this.vm.run(wrapper);
    } catch (err) {
      throw new Error(
        // Disable restrict-template-expressions due to unknown error type in vm.run (error can be everything -> err can not be narrowed down)
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Malformed expression received: ${expression}\n Error message: ${err}`,
      );
    }
    if (typeof result !== 'boolean') {
      throw new Error(
        `Malformed expression received: ${expression}\n Error message: ` +
          'Expected result to be a boolean expression!',
      );
    } else {
      return result;
    }
  }
}
