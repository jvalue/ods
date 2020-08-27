export function isNumber (x: unknown): x is number {
  return typeof x === 'number'
}

export function isString (x: unknown): x is string {
  return typeof x === 'string'
}

export function isObject (x: unknown): x is object {
  return typeof x === 'object'
}

// Helper function to fix issue that `in` operator as type guard is not widening type with the asserted property key
// See https://github.com/microsoft/TypeScript/issues/21732
export function hasProperty<P extends PropertyKey, O extends object> (object: O, name: P):
  object is O & { [K in P]: unknown } {
  return name in object
}
