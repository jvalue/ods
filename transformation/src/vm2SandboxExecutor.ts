import { VM, VMScript } from 'vm2'

import SandboxExecutor from './interfaces/sandboxExecutor'
import ExecutionResult from './interfaces/executionResult'

export default class VM2SandboxExecutor implements SandboxExecutor {
  vm: VM;

  constructor () {
    this.vm = new VM({
      timeout: 5000
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
      // TODO: fork vm2 or wait for PR to see compilation errors code
      script.compile()
    } catch (err) {
      // TODO: stacktrace prettifying
      return { data: undefined, error: err }
    }

    try {
      const result = this.vm.run(script)
      return { data: result, error: undefined }
    } catch (err) {
      // TODO: stacktrace prettifying
      return { data: undefined, error: err }
    }
  }

  evaluate (expression: string, data: object): boolean {
    const wrapper =
      'f=function(data){' +
      'return ' +
      expression +
      '};f(' +
      JSON.stringify(data) +
      ');'

    let result = false
    try {
      result = this.vm.run(wrapper)
    } catch (err) {
      console.error('Malformed expression received: ' + expression, err)
    }
    if (typeof result !== 'boolean') {
      return false
    } else {
      return result
    }
  }
}
