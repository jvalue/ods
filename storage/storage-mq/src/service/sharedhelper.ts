export function hasParent (parent: string): boolean {
  return parent !== ''
}

export function isArray (value: string): boolean {
  return value === 'array'
}

export function isObject (value: string): boolean {
  return value === 'object'
}

export type MapSchema<T extends Record<string, keyof MapSchemaTypes>> = {
  -readonly [K in keyof T]: MapSchemaTypes[T[K]]
}

type MapSchemaTypes = {
  string: string;
  integer: number;
  boolean: boolean;
  float: number;
  number: number;
  regexp: RegExp;
}