// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNumber (x: any): x is number {
  return typeof x === 'number'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isString (x: any): x is string {
  return typeof x === 'string'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject (x: any): x is any {
  return typeof x === 'object'
}
