import * as SharedHelper from './sharedHelper';

export default class SchemaToObjectParser {
  async parse(
    schema: SharedHelper.JsonSchemaElementBase,
  ): Promise<{ [key: string]: string | Record<string, unknown> }> {
    let parsedSchema: { [key: string]: string | Record<string, unknown> } = {};
    if (SharedHelper.isArray(schema)) {
      parsedSchema = await this.doParse(schema.items);
    } else if (SharedHelper.isObject(schema)) {
      parsedSchema = await this.doParse(schema);
    }

    return parsedSchema;
  }

  async doParse(
    schema: SharedHelper.JsonSchemaElementBase,
  ): Promise<{ [key: string]: string | Record<string, unknown> }> {
    const parsedSchema: { [key: string]: string | Record<string, unknown> } =
      {};
    if (SharedHelper.isObject(schema)) {
      for (const key in schema.properties) {
        if (Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          const currentProperty = schema.properties[key];
          if (SharedHelper.isObject(currentProperty)) {
            parsedSchema[key] = await this.doParse(currentProperty);
          } else if (SharedHelper.isArray(currentProperty)) {
            const childSchema = currentProperty.items;
            if (SharedHelper.isObject(childSchema)) {
              parsedSchema[key] = await this.doParse(childSchema);
            } else {
              if (currentProperty.items.type !== undefined) {
                const type: string = currentProperty.items.type;
                parsedSchema[key] = type + '[]';
              }
            }
          } else {
            parsedSchema[key] = currentProperty.type;
          }
        }
      }
    }
    // TODO else array etc (if that should be supported)

    return parsedSchema;
  }
}
