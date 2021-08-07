import * as SharedHelper from './sharedhelper'


export default class SchemaToObjectParser {
  
  async parse (
    schema: any
    ): Promise<{[key: string]: string|object} > {
    let parsedSchema: {[key: string]: string|object}  = {}
    if (SharedHelper.isArray(schema.type)) {
      parsedSchema = await this.doParse(schema.items)
    } else if (SharedHelper.isObject(schema.type)) {
      parsedSchema = await this.doParse(schema)
    }

    return parsedSchema
  }

  async doParse (
    schema: any,
  ): Promise<{[key: string]: string|object} > {
    const parsedSchema: {[key: string]: string|object} = {}
    for (const key in schema.properties) {
      const currentProperty = schema.properties[key]
      if (SharedHelper.isObject(currentProperty.type)) {
        parsedSchema[key] = await this.doParse(currentProperty)
      } else if (SharedHelper.isArray(currentProperty.type)) {
        const childSchema = currentProperty.items
        if (SharedHelper.isObject(childSchema.type)) {
          parsedSchema[key] = await this.doParse(childSchema)
        } else {
          if (currentProperty.items.type !== undefined) {
            parsedSchema[key] = currentProperty.items.type + '[]'
          }
        }
      } else {
        parsedSchema[key] = currentProperty.type
      }
    }
    return parsedSchema
  }
}