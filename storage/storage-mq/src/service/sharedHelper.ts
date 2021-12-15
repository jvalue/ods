export function hasParent(parent: string): boolean {
  return parent !== '';
}

export function isArray(
  value: JsonSchemaElementBase,
): value is JsonSchemaElementArray {
  return value.type === 'array';
}

export function isObject(
  value: JsonSchemaElementBase,
): value is JsonSchemaElementObject {
  return value.type === 'object';
}

export function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val != null;
}

type JsonSchemaTypes =
  | 'string'
  | 'number'
  | 'integer'
  | 'object'
  | 'array'
  | 'null'
  | 'boolean';

// TODO perhaps support additional params, like enums: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/json-schema/index.d.ts
// The package above was not used due to consisting of only one interface with every possible attribute as optional -> type-guards useless due to additionally required undefined check

export interface JsonSchemaElementBase {
  $schema?: string;
  $id: string;
  type: JsonSchemaTypes;
  // Object and array specific parameters
  additionalItems?: boolean;
  additionalProperties?: boolean;
  required?: string[];
  properties?: Record<string, JsonSchemaElementBase>;
  items?: JsonSchemaElementBase;
}

export interface JsonSchemaElementObject extends JsonSchemaElementBase {
  type: 'object';
  additionalProperties?: boolean;
  required?: string[];
  properties: Record<string, JsonSchemaElementBase>;
}

export interface JsonSchemaElementArray extends JsonSchemaElementBase {
  type: 'array';
  additionalItems?: boolean;
  items: JsonSchemaElementBase;
}
