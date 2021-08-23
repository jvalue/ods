export default interface PostgresParser {
  parseCreateStatement: (
    schema: any,
    pgSchemaName: string,
    tableName: string,
    index?: number,
    parentName?: string
  ) => Promise<string[]>

  parseInsertStatement: (
    schema: any,
    data: any,
    pgSchemaName: string,
    tableName: string,
    parentId: number,
    index?: number,
    parentName?: string
  ) => Promise<string>
}
