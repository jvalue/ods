import PostgresParser from './postgresParser'
import * as SharedHelper from './sharedhelper'

const CREATE_STATEMENT =
(schema: string, table: string): string =>
`CREATE TABLE IF NOT EXISTS "${schema}"."${table}" (` +
  '"id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY, ' +
  '"createdAt" timestamp not null default CURRENT_TIMESTAMP'

const INSERT_STATEMENT_COLUMNS = (schema: string, table: string): string =>
  `INSERT INTO "${schema}"."${table}" (`

const INSERT_CONTENT_STATEMENT_VALUES = ') VALUES ('

const PRIMARY_KEY_STATEMENT =
(schema: string, table: string): string => `, CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)`

const FOREGIN_KEY_STATEMENT =
(schema: string, table: string, parentTable: string): string =>
`, CONSTRAINT "Data_fk_${schema}_${table}" FOREIGN KEY (${parentTable}id)` +
  `REFERENCES ${schema}.${parentTable}(id)`

const END_STATEMENT_CREATE = ')'

const END_STATEMENT_INSERT = ') RETURNING *;'

const PG_TYPES: any = { string: 'text', number: 'integer', boolean: 'boolean' }

export default class JsonSchemaParser implements PostgresParser {
  private postgresSchemaCreate: string[] = []
  private postgresSchemaInsertColumns: string[] = []
  private postgresSchemaInsertValues: string[] = []

  async parseCreateStatement (
    schema: any,
    pgSchemaName: string,
    tableName: string,
    index: number = 0,
    parentName: string = ''
  ): Promise<string[]> {
    if (SharedHelper.isArray(schema.type)) {
      await this.doParseCreate(schema.items, index, pgSchemaName, tableName, parentName)
    } else if (SharedHelper.isObject(schema.type)) {
      await this.doParseCreate(schema, index, pgSchemaName, tableName, parentName)
    }

    return this.postgresSchemaCreate
  }

  async doParseCreate (
    schema: any,
    index: number,
    pgSchemaName: string,
    tableName: string,
    parentName: string = ''
  ): Promise<void> {
    const currentIndex = index
    this.postgresSchemaCreate[currentIndex] = CREATE_STATEMENT(pgSchemaName, tableName)

    for (const key in schema.properties) {
      const currentProperty = schema.properties[key]
      if (SharedHelper.isObject(currentProperty.type)) {
        await this.parseCreateStatement(currentProperty, pgSchemaName, tableName + '_' + key, ++index, tableName)
      } else if (SharedHelper.isArray(currentProperty.type)) {
        const childSchema = currentProperty.items
        if (SharedHelper.isObject(childSchema.type)) {
          await this.parseCreateStatement(childSchema, pgSchemaName, tableName + '_' + key, ++index, tableName)
        } else {
          if (currentProperty.items.type !== undefined) {
            this.postgresSchemaCreate[currentIndex] +=
            `, "${key}" ${PG_TYPES[currentProperty.items.type]}[]`
          }
        }
      } else {
        this.postgresSchemaCreate[currentIndex] += `, "${key}" ${PG_TYPES[currentProperty.type]}`
      }
    }

    if (SharedHelper.hasParent(parentName)) {
      this.postgresSchemaCreate[currentIndex] += `, "${parentName}id" bigint NOT NULL`
      this.postgresSchemaCreate[currentIndex] += FOREGIN_KEY_STATEMENT(pgSchemaName, tableName, parentName)
    }

    this.postgresSchemaCreate[currentIndex] += PRIMARY_KEY_STATEMENT(pgSchemaName, tableName)
    this.postgresSchemaCreate[currentIndex] += END_STATEMENT_CREATE
  }

  async parseInsertStatement (
    schema: any,
    data: any,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    index: number = 0,
    parentName: string = ''
  ): Promise<string> {
    if (SharedHelper.isArray(schema.type)) {
      await this.doParseInsertArray(schema.items, data, index, pgSchemaName, tableName, parentId, parentName)
    } else if (SharedHelper.isObject(schema.type)) {
      await this.doParseInsertObject(schema, data, index, pgSchemaName, tableName, parentId, parentName)
    }

    let result: string = 'BEGIN;'
    this.postgresSchemaInsertColumns.forEach((insertColumnString, index) => {
      if (insertColumnString.charAt(insertColumnString.length - 1) === ',') {
        result += insertColumnString.slice(0, -1) + // drops the unnecessary comma
          this.postgresSchemaInsertValues[index].slice(0, -1) + // drops the unnecessary comma
          END_STATEMENT_INSERT
      } else {
        result += insertColumnString +
          this.postgresSchemaInsertValues[index] +
          END_STATEMENT_INSERT
      }
    })
    result += 'END;'
    return result
  }

  async doParseInsertArray (
    schema: any,
    data: any[],
    index: number,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    parentName: string = ''
  ): Promise<void> {
    let element: any
    for (element of data) {
      const currentIndex = index
      this.postgresSchemaInsertColumns[currentIndex] = INSERT_STATEMENT_COLUMNS(pgSchemaName, tableName) // Insertion
      this.postgresSchemaInsertValues[currentIndex] = INSERT_CONTENT_STATEMENT_VALUES
      for (const key in schema.properties) {
        const currentProperty = schema.properties[key]
        if (SharedHelper.isObject(currentProperty.type)) {
          await this.parseInsertStatement(
            currentProperty,
            element[key],
            pgSchemaName,
            tableName + '_' + key,
            parentId,
            ++index,
            tableName
          )
        } else if (SharedHelper.isArray(currentProperty.type)) {
          const childSchema = currentProperty.items
          if (SharedHelper.isObject(childSchema.type)) {
            await this.parseInsertStatement(
              currentProperty,
              element[key],
              pgSchemaName,
              tableName + '_' + key,
              parentId,
              ++index,
              tableName
            )
          } else {
            if (currentProperty.items.type !== undefined) {
              this.addToInsertArrays(currentIndex, key, element[key], `${currentProperty.items.type}[]`)
            }
          }
        } else {
          this.addToInsertArrays(currentIndex, key, element[key], currentProperty.type)
        }
      }
      if (parentName !== '') {
        this.addToInsertArrays(currentIndex, parentName + 'id', parentId, 'number')
      }
      index = await this.asyncIncrement(index)
      parentId = await this.asyncIncParent(parentId, parentName)
    }
  }

  async doParseInsertObject (
    schema: any,
    data: any,
    index: number,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    parentName: string = ''
  ): Promise<any> {
    const currentIndex = index
    this.postgresSchemaInsertColumns[currentIndex] = INSERT_STATEMENT_COLUMNS(pgSchemaName, tableName) // Insertion
    this.postgresSchemaInsertValues[currentIndex] = INSERT_CONTENT_STATEMENT_VALUES
    for (const key in schema.properties) {
      const currentProperty = schema.properties[key]
      if (SharedHelper.isObject(currentProperty.type)) {
        await this.parseInsertStatement(
          currentProperty,
          data[key],
          pgSchemaName,
          tableName + '_' + key,
          parentId,
          ++index,
          tableName
        )
      } else if (SharedHelper.isArray(currentProperty.type)) {
        const childSchema = currentProperty.items
        if (SharedHelper.isObject(childSchema.type)) {
          await this.parseInsertStatement(
            currentProperty,
            data[key],
            pgSchemaName,
            tableName + '_' + key,
            parentId,
            ++index,
            tableName
          )
        } else {
          if (currentProperty.items.type !== undefined) {
            this.addToInsertArrays(currentIndex, key, data[key], `${currentProperty.items.type}[]`)
          }
        }
      } else {
        this.addToInsertArrays(currentIndex, key, data[key], currentProperty.type)
      }
    }
    if (parentName !== '') {
      this.addToInsertArrays(currentIndex, parentName + 'id', parentId, 'number')
    }
  }

  addToInsertArrays (index: number, key: string, value: any, type: string): void {
    this.postgresSchemaInsertColumns[index] += `"${key}",`
    if (value === undefined) {
      value = null
    }
    if (type.includes('[]')) {
      this.postgresSchemaInsertValues[index] += `'{"${value}"}',`
    } else if (type === 'number') {
      this.postgresSchemaInsertValues[index] += `${value},`
    } else {
      this.postgresSchemaInsertValues[index] += `'${value}',`
    }
  }

  async asyncIncrement (value: number): Promise<number> {
    return ++value
  }

  async asyncIncParent (value: number, name: string): Promise<number> {
    return (name === '') ? ++value : value
  }
}
