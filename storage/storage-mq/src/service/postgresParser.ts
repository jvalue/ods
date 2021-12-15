import { JsonSchemaElementBase } from './sharedHelper';

export default interface PostgresParser {
  parseCreateStatement: (
    schema: JsonSchemaElementBase,
    pgSchemaName: string,
    tableName: string,
    index?: number,
    parentName?: string,
  ) => Promise<string[]>;

  parseInsertStatement: (
    schema: JsonSchemaElementBase,
    data: unknown,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    index?: number,
    parentName?: string,
  ) => Promise<string>;
}
