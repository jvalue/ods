import { VM } from 'vm2';

const vm = new VM({
  timeout: 5000
});

function assertIsObjectOrArray (data: any) {
  if (!(typeof data === 'object')) {
    throw new TypeError('given data is no object or array');
  }
}

export function execute (func: string, data: any): string {
  assertIsObjectOrArray(data);

  let wrapper =
    'f=function(data){' +
    func +
    ' ;return data;};f(' +
    JSON.stringify(data) +
    ')';

  console.log(wrapper);
  const result = vm.run(wrapper);
  return JSON.stringify(result);
}
