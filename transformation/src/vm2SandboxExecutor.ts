import { VM, VMScript } from 'vm2'

import SandboxExecutor from './interfaces/sandboxExecutor'
import ExecutionResult from './interfaces/executionResult'
import { convertRuntimeError, convertSyntaxError } from './vm2StacktraceParser'

const FUNCTION_WRAP_PREFIX_LENGTH = 1

export default class VM2SandboxExecutor implements SandboxExecutor {
  vm: VM;

  constructor (timeout = 5000) {
    this.vm = new VM({
      timeout
    })
  }

  private assertIsObjectOrArray (data: object): void {
    if (!(typeof data === 'object')) {
      throw new TypeError('given data is no object or array')
    }
  }

  execute (code: string, data: object): ExecutionResult {
    this.assertIsObjectOrArray(data)

    const json = JSON.stringify(data)

    const script = new VMScript(code, 'main')
    script.wrap('function main(data) {\n', `\n}\nmain(${json});`)

    try {
      script.compile()
    } catch (err) {
      return { data: undefined, error: convertSyntaxError(err, FUNCTION_WRAP_PREFIX_LENGTH) }
    }

    try {
      const result = this.vm.run(script)
      return { data: result, error: undefined }
    } catch (err) {
      return { data: undefined, error: convertRuntimeError(err, FUNCTION_WRAP_PREFIX_LENGTH) }
    }
  }
}
