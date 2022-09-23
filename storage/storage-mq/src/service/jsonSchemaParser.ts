import PostgresParser from './postgresParser';
import * as SharedHelper from './sharedHelper';

const CREATE_STATEMENT = (schema: string, table: string): string =>
  `CREATE TABLE IF NOT EXISTS "${schema}"."${table}" (` +
  '"id" bigint NOT NULL GENERATED ALWAYS AS IDENTITY, ' +
  '"createdAt" timestamp not null default CURRENT_TIMESTAMP';

const INSERT_STATEMENT_COLUMNS = (schema: string, table: string): string =>
  `INSERT INTO "${schema}"."${table}" (`;

const INSERT_CONTENT_STATEMENT_VALUES = ') VALUES (';

const PRIMARY_KEY_STATEMENT = (schema: string, table: string): string =>
  `, CONSTRAINT "Data_pk_${schema}_${table}" PRIMARY KEY (id)`;

const FOREGIN_KEY_STATEMENT = (
  schema: string,
  table: string,
  parentTable: string,
): string =>
  `, CONSTRAINT "Data_fk_${schema}_${table}" FOREIGN KEY (${parentTable}id)` +
  `REFERENCES ${schema}.${parentTable}(id)`;

const END_STATEMENT_CREATE = ')';

const END_STATEMENT_INSERT = ') RETURNING *;';

const PG_TYPES: Record<string, string> = {
  string: 'text',
  number: 'integer',
  boolean: 'boolean',
};

export default class JsonSchemaParser implements PostgresParser {
  private postgresSchemaCreate: string[] = [];
  private postgresSchemaInsertColumns: string[] = [];
  private postgresSchemaInsertValues: string[] = [];

  async parseCreateStatement(
    schema: SharedHelper.JsonSchemaElementBase,
    pgSchemaName: string,
    tableName: string,
    index = 0,
    parentName = '',
  ): Promise<string[]> {
    if (SharedHelper.isArray(schema)) {
      await this.doParseCreate(
        schema.items,
        index,
        pgSchemaName,
        tableName,
        parentName,
      );
    } else if (SharedHelper.isObject(schema)) {
      await this.doParseCreate(
        schema,
        index,
        pgSchemaName,
        tableName,
        parentName,
      );
    }

    return this.postgresSchemaCreate;
  }

  async doParseCreate(
    schema: SharedHelper.JsonSchemaElementBase,
    index: number,
    pgSchemaName: string,
    tableName: string,
    parentName = '',
  ): Promise<void> {
    const currentIndex = index;
    this.postgresSchemaCreate[currentIndex] = CREATE_STATEMENT(
      pgSchemaName,
      tableName,
    );

    if (SharedHelper.isObject(schema)) {
      for (const key in schema.properties) {
        if (Object.prototype.hasOwnProperty.call(schema.properties, key)) {
          const currentProperty = schema.properties[key];
          if (SharedHelper.isObject(currentProperty)) {
            await this.parseCreateStatement(
              currentProperty,
              pgSchemaName,
              tableName + '_' + key,
              ++index,
              tableName,
            );
          } else if (SharedHelper.isArray(currentProperty)) {
            const childSchema = currentProperty.items;
            if (SharedHelper.isObject(childSchema)) {
              await this.parseCreateStatement(
                childSchema,
                pgSchemaName,
                tableName + '_' + key,
                ++index,
                tableName,
              );
            } else {
              if (currentProperty.items.type !== undefined) {
                this.postgresSchemaCreate[currentIndex] += `, "${key}" ${
                  PG_TYPES[currentProperty.items.type as string]
                }[]`;
              }
            }
          } else {
            this.postgresSchemaCreate[currentIndex] += `, "${key}" ${
              PG_TYPES[currentProperty.type]
            }`;
          }
        }
      }
    }
    // TODO else if array AND else simple datatype

    if (SharedHelper.hasParent(parentName)) {
      this.postgresSchemaCreate[
        currentIndex
      ] += `, "${parentName}id" bigint NOT NULL`;
      this.postgresSchemaCreate[currentIndex] += FOREGIN_KEY_STATEMENT(
        pgSchemaName,
        tableName,
        parentName,
      );
    }

    this.postgresSchemaCreate[currentIndex] += PRIMARY_KEY_STATEMENT(
      pgSchemaName,
      tableName,
    );
    this.postgresSchemaCreate[currentIndex] += END_STATEMENT_CREATE;
  }

  async parseInsertStatement(
    schema: SharedHelper.JsonSchemaElementBase,
    data: unknown,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    index = 0,
    parentName = '',
  ): Promise<string> {
    if (SharedHelper.isArray(schema)) {
      await this.doParseInsertArray(
        schema.items,
        data as unknown[],
        index,
        pgSchemaName,
        tableName,
        parentId,
        parentName,
      );
    } else if (SharedHelper.isObject(schema)) {
      await this.doParseInsertObject(
        schema,
        data,
        index,
        pgSchemaName,
        tableName,
        parentId,
        parentName,
      );
    }

    let result = 'BEGIN;';
    this.postgresSchemaInsertColumns.forEach((insertColumnString, index) => {
      if (insertColumnString.charAt(insertColumnString.length - 1) === ',') {
        result +=
          insertColumnString.slice(0, -1) + // Drops the unnecessary comma
          this.postgresSchemaInsertValues[index].slice(0, -1) + // Drops the unnecessary comma
          END_STATEMENT_INSERT;
      } else {
        result +=
          insertColumnString +
          this.postgresSchemaInsertValues[index] +
          END_STATEMENT_INSERT;
      }
    });
    result += 'END;';
    return result;
  }

  async doParseInsertArray(
    schema: SharedHelper.JsonSchemaElementBase,
    data: unknown[],
    index: number,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    parentName = '',
  ): Promise<void> {
    let element: unknown;
    for (element of data) {
      const currentIndex = index;
      this.postgresSchemaInsertColumns[currentIndex] = INSERT_STATEMENT_COLUMNS(
        pgSchemaName,
        tableName,
      ); // Insertion
      this.postgresSchemaInsertValues[currentIndex] =
        INSERT_CONTENT_STATEMENT_VALUES;

      if (SharedHelper.isObject(schema)) {
        for (const key in schema.properties) {
          if (Object.prototype.hasOwnProperty.call(schema.properties, key)) {
            const currentProperty = schema.properties[key];
            if (SharedHelper.isObject(currentProperty)) {
              await this.parseInsertStatement(
                currentProperty,
                (element as Record<string, unknown>)[key],
                pgSchemaName,
                tableName + '_' + key,
                parentId,
                ++index,
                tableName,
              );
            } else if (SharedHelper.isArray(currentProperty)) {
              const childSchema = currentProperty.items;
              if (SharedHelper.isObject(childSchema)) {
                await this.parseInsertStatement(
                  currentProperty,
                  (element as Record<string, unknown>)[key],
                  pgSchemaName,
                  tableName + '_' + key,
                  parentId,
                  ++index,
                  tableName,
                );
              } else {
                if (currentProperty.items.type !== undefined) {
                  this.addToInsertArrays(
                    currentIndex,
                    key,
                    (element as Record<string, unknown>)[key],
                    `${currentProperty.items.type}[]`,
                  );
                }
              }
            } else {
              this.addToInsertArrays(
                currentIndex,
                key,
                (element as Record<string, unknown>)[key],
                currentProperty.type,
              );
            }
          }
        }
      }
      // TODO else if array AND else simple datatype

      if (parentName !== '') {
        this.addToInsertArrays(
          currentIndex,
          parentName + 'id',
          parentId,
          'number',
        );
      }
      index = await this.asyncIncrement(index);
      parentId = await this.asyncIncParent(parentId, parentName);
    }
  }

  async doParseInsertObject(
    schema: SharedHelper.JsonSchemaElementObject,
    data: unknown,
    index: number,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    parentName = '',
  ): Promise<void> {
    const currentIndex = index;
    this.postgresSchemaInsertColumns[currentIndex] = INSERT_STATEMENT_COLUMNS(
      pgSchemaName,
      tableName,
    ); // Insertion
    this.postgresSchemaInsertValues[currentIndex] =
      INSERT_CONTENT_STATEMENT_VALUES;
    for (const key in schema.properties) {
      if (Object.prototype.hasOwnProperty.call(schema.properties, key)) {
        const currentProperty = schema.properties[key];
        if (SharedHelper.isObject(currentProperty)) {
          await this.parseInsertStatement(
            currentProperty,
            (data as Record<string, unknown>)[key],
            pgSchemaName,
            tableName + '_' + key,
            parentId,
            ++index,
            tableName,
          );
        } else if (SharedHelper.isArray(currentProperty)) {
          const childSchema = currentProperty.items;
          if (SharedHelper.isObject(childSchema)) {
            await this.parseInsertStatement(
              currentProperty,
              (data as Record<string, unknown>)[key],
              pgSchemaName,
              tableName + '_' + key,
              parentId,
              ++index,
              tableName,
            );
          } else {
            if (currentProperty.items.type !== undefined) {
              this.addToInsertArrays(
                currentIndex,
                key,
                (data as Record<string, unknown>)[key],
                `${currentProperty.items.type}[]`,
              );
            }
          }
        } else {
          this.addToInsertArrays(
            currentIndex,
            key,
            (data as Record<string, unknown>)[key],
            currentProperty.type,
          );
        }
      }
    }
    if (parentName !== '') {
      this.addToInsertArrays(
        currentIndex,
        parentName + 'id',
        parentId,
        'number',
      );
    }
  }

  addToInsertArrays(
    index: number,
    key: string,
    value: unknown,
    type: string,
  ): void {
    this.postgresSchemaInsertColumns[index] += `"${key}",`;
    if (value === undefined) {
      value = null;
    }
    if (type.includes('[]')) {
      // TODO testing if (value as string) works, or some other way without using eslint-disable
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.postgresSchemaInsertValues[index] += `'{"${value}"}',`;
    } else if (type === 'number') {
      // TODO testing if (value as string) works, or some other way without using eslint-disable
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.postgresSchemaInsertValues[index] += `${value},`;
    } else {
      // TODO testing if (value as string) works, or some other way without using eslint-disable
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.postgresSchemaInsertValues[index] += `'${value}',`;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async asyncIncrement(value: number): Promise<number> {
    return ++value;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async asyncIncParent(value: number, name: string): Promise<number> {
    return name === '' ? ++value : value;
  }
}
