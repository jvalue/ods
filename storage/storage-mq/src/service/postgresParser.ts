export default interface PostgresParser {
  parseCreateStatement: (
    schema: any,
    schemaName: string,
    tableName: string,
    index?: number,
    parentName?: string
  ) => Promise<string[]>

  parseInsertStatement: (
    schema: any,
    data: any,
    schemaName: string,
    tableName: string,
    parentId: number,
    index?: number,
    parentName?: string
  ) => Promise<string>
}
