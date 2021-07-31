const CREATE_STATEMENT =
(schema: string, table: string): string => 
`CREATE TABLE IF NOT EXISTS "${schema}"."${table}" ("id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY` 

const PRIMARY_KEY_STATEMENT =
(schema: string, table: string): string => `, CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)`

const FOREGIN_KEY_STATEMENT =
(schema: string, table: string, parentTable: string): string => 
`, CONSTRAINT "Data_fk_${schema}_${table}" FOREIGN KEY (${parentTable}id) REFERENCES ${schema}.${parentTable}(id)`

const END_STATEMENT = `)`

const PG_TYPES: any = { string: 'text', number: 'integer'}

export default class SchemaParser {

  private postgresSchema: String[] = []

  parse (schema: any, schemaName: string, tableName: string, index: number = 0, parentName: string = ''): String[] {
    if (this.isArray(schema.type)) {
      this.doParse(schema.items, index, schemaName, tableName)
    } else if (this.isObject(schema.type)) {
      this.doParse(schema, index, schemaName, tableName, parentName)
    }

    return this.postgresSchema
  }

  doParse (schema: any, index: number, schemaName: string, tableName: string, parentName: string = ''): void {
    this.postgresSchema[index] = CREATE_STATEMENT(schemaName, tableName)
    
    for (const key in schema.properties) {
      if (this.isObject(schema.properties[key].type)) {
        this.parse(schema.properties[key], schemaName, tableName+'_'+key, index+1, tableName)
        continue
      }
      this.postgresSchema[index] += `, "${key}" ${PG_TYPES[schema.properties[key].type]}`
    }
    
    if (parentName !== '') {
      this.postgresSchema[index] += `, "${parentName}id" bigint NOT NULL`
      this.postgresSchema[index] += FOREGIN_KEY_STATEMENT(schemaName, tableName, parentName)
    }
    this.postgresSchema[index] += PRIMARY_KEY_STATEMENT(schemaName, tableName)
    this.postgresSchema[index] += END_STATEMENT
  }

  isArray (value: string): boolean  {
    return value === 'array'
  }

  isObject (value: string): boolean {
    return value === 'object'
  }
}
