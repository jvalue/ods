import { VM, VMScript } from 'vm2'

import SandboxExecutor from './interfaces/sandboxExecutor';


const FUNCTION_WRAP_PREFIX_LENGTH = 1

export default class VM2SandboxExecutor implements SandboxExecutor {
  vm: VM;

  constructor (timeout = 5000) {
    this.vm = new VM({
      timeout
    })
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
      // console.error('Malformed expression received: ' + expression, err)
    }
    if (typeof result !== 'boolean') {
      return false
    } else {
      return result
    }
  }
}
