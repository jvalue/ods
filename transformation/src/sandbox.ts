import { VM } from 'vm2'

const vm = new VM({
  timeout: 5000
})

function assertIsObjectOrArray (data: object): void {
  if (!(typeof data === 'object')) {
    throw new TypeError('given data is no object or array')
  }
}

export function execute (func: string, data: object): string {
  assertIsObjectOrArray(data)

  const wrapper =
    'f=function(data){' +
    func +
    ' ;return data;};f(' +
    JSON.stringify(data) +
    ');'

  const result = vm.run(wrapper)
  return JSON.stringify(result)
}

export function evaluate (expression: string, data: object): boolean {
  const wrapper =
    'f=function(data){' +
    'return ' +
    expression +
    '};f(' +
    JSON.stringify(data) +
    ');'

  let result = false
  try {
    result = vm.run(wrapper)
  } catch (err) {
    console.error('Malformed expression received: ' + expression, err)
  }
  if (typeof result !== 'boolean') {
    return false
  } else {
    return result
  }
}
