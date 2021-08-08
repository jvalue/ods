import { response } from "express"
import * as SharedHelper from "./sharedhelper"

const CREATE_STATEMENT =
(schema: string, table: string): string =>
`CREATE TABLE IF NOT EXISTS "${schema}"."${table}" ("id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY`

const INSERT_STATEMENT_COLUMNS = (schema: string, table: string): string =>
  `INSERT INTO "${schema}"."${table}" (`

const INSERT_CONTENT_STATEMENT_VALUES = ') VALUES ('

const PRIMARY_KEY_STATEMENT =
(schema: string, table: string): string => `, CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)`

const FOREGIN_KEY_STATEMENT =
(schema: string, table: string, parentTable: string): string =>
`, CONSTRAINT "Data_fk_${schema}_${table}" FOREIGN KEY (${parentTable}id) REFERENCES ${schema}.${parentTable}(id)`

const END_STATEMENT_CREATE = ')'

const END_STATEMENT_INSERT = ') RETURNING *'

const PG_TYPES: any = { string: 'text', number: 'integer', boolean: 'boolean' }

export default class SchemaParser {
  private postgresSchemaCreate: string[] = []
  private postgresSchemaInsertColumns: string[] = []
  private postgresSchemaInsertValues: string[] = []

  async parseCreateStatement (
    schema: any,
    schemaName: string,
    tableName: string,
    index: number = 0,
    parentName: string = ''
  ): Promise<string[]> {
    if (SharedHelper.isArray(schema.type)) {
      await this.doParseCreate(schema.items, index, schemaName, tableName, parentName)
    } else if (SharedHelper.isObject(schema.type)) {
      await this.doParseCreate(schema, index, schemaName, tableName, parentName)
    }

    return this.postgresSchemaCreate
  }

  async doParseCreate (
    schema: any,
    index: number,
    schemaName: string,
    tableName: string,
    parentName: string = ''
  ): Promise<void> {
    const currentIndex = index
    this.postgresSchemaCreate[currentIndex] = CREATE_STATEMENT(schemaName, tableName)

    for (const key in schema.properties) {
      const currentProperty = schema.properties[key]
      if (SharedHelper.isObject(currentProperty.type)) {
        await this.parseCreateStatement(currentProperty, schemaName, tableName + '_' + key, ++index, tableName)
      } else if (SharedHelper.isArray(currentProperty.type)) {
        const childSchema = currentProperty.items
        if (SharedHelper.isObject(childSchema.type)) {
          await this.parseCreateStatement(childSchema, schemaName, tableName + '_' + key, ++index, tableName)
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
      this.postgresSchemaCreate[currentIndex] += FOREGIN_KEY_STATEMENT(schemaName, tableName, parentName)
    }

    this.postgresSchemaCreate[currentIndex] += PRIMARY_KEY_STATEMENT(schemaName, tableName)
    this.postgresSchemaCreate[currentIndex] += END_STATEMENT_CREATE
  }

  async parse (
    schema: any,
    data: any,
    schemaName: string,
    tableName: string,
    parentId: number,
    index: number = 0,
    parentName: string = ''
  ): Promise<string[]> {
    if (SharedHelper.isArray(schema.type)) {
      await this.doParseArray(schema.items, data, index, schemaName, tableName, parentId,parentName)
    } else if (SharedHelper.isObject(schema.type)) {
      await this.doParseObject(schema, data, index, schemaName, tableName, parentId, parentName)
    }

    const result: string[] = []    
    this.postgresSchemaInsertColumns.forEach( (insertColumnString, index) => {
      if (insertColumnString.charAt(insertColumnString.length - 1) === ',') {
        result[index] = insertColumnString.slice(0, -1) + // drops the unnecessary comma
          this.postgresSchemaInsertValues[index].slice(0,-1) + // drops the unnecessary comma
          END_STATEMENT_INSERT
        } else {
          result[index] = insertColumnString +
            this.postgresSchemaInsertValues[index] +
            END_STATEMENT_INSERT
      }
    })
    return result
  }

  async doParseArray (
    schema: any,
    data: any,
    index: number,
    schemaName: string,
    tableName: string,
    parentId: number,
    parentName: string = ''
  ): Promise<any> {
    let currentIndex = index
    const element = data.shift() // instead of loop to handle async behavior 
    if (element === undefined) {
      return
    }
    this.postgresSchemaInsertColumns[currentIndex] = INSERT_STATEMENT_COLUMNS(schemaName, tableName) // Insertion
    this.postgresSchemaInsertValues[currentIndex] = INSERT_CONTENT_STATEMENT_VALUES
    for (const key in schema.properties) {
      const currentProperty = schema.properties[key]
      if (SharedHelper.isObject(currentProperty.type)) {
        await this.parse(
          currentProperty,
          element[key],
          schemaName,
          tableName + '_' + key,
          parentId,
          ++index,
          tableName
        )
      } else if (SharedHelper.isArray(currentProperty.type)) {
        const childSchema = currentProperty.items
        if (SharedHelper.isObject(childSchema.type)) {
          await this.parse(
            currentProperty,
            data[key],
            schemaName,
            tableName + '_' + key,
            (parentName === '') ? parentId: 1,
            ++index,
            tableName
          )        } else {
          if (currentProperty.items.type !== undefined) {
            this.addToInsertArrays(currentIndex, key, element[key])
          }
        }
      } else {
        this.addToInsertArrays(currentIndex, key, element[key])
      }
    }
    if ( parentName !== '') {
      this.addToInsertArrays(currentIndex, parentName + 'id', parentId)
    }
    await this.doParseArray(
      schema,
      data,
      ++index,
      schemaName,
      tableName,
      (parentName === '') ? ++parentId: parentId,
      parentName
    )
  }

  async doParseObject (
    schema: any,
    data: any,
    index: number,
    schemaName: string,
    tableName: string,
    parentId: number,
    parentName: string = ''
  ): Promise<any> {
    let currentIndex = index
    this.postgresSchemaInsertColumns[currentIndex] = INSERT_STATEMENT_COLUMNS(schemaName, tableName) // Insertion
    this.postgresSchemaInsertValues[currentIndex] = INSERT_CONTENT_STATEMENT_VALUES
    for (const key in schema.properties) {
      const currentProperty = schema.properties[key]
      if (SharedHelper.isObject(currentProperty.type)) {
        await this.parse(
          currentProperty,
          data[key],
          schemaName,
          tableName + '_' + key,
          (parentName === '') ? parentId: 1,
          ++index,
          tableName
        )
      } else if (SharedHelper.isArray(currentProperty.type)) {
        const childSchema = currentProperty.items
        if (SharedHelper.isObject(childSchema.type)) {
          await this.parse(
            currentProperty,
            data[key],
            schemaName,
            tableName + '_' + key,
            (parentName === '') ? parentId: 1,
            ++index,
            tableName
          )
        } else {
          if (currentProperty.items.type !== undefined) {
            this.addToInsertArrays(currentIndex, key, data[key])
          }
        }
      } else {
        this.addToInsertArrays(currentIndex, key, data[key])
      }
    }
    if ( parentName !== '') {
      this.addToInsertArrays(currentIndex, parentName + 'id', parentId)
    }
  }

  addToInsertArrays (index: number, key: string, value: any): void {
    this.postgresSchemaInsertColumns[index] += `"${key}",`
    this.postgresSchemaInsertValues[index] += `"${value}",`
  }
}
