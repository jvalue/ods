export interface StorageStructureRepository {
  create: (tableIdentifier: string) => Promise<void>
  createForSchema: (schema: any, schemaName: string, tableName: string) => Promise<void>
  delete: (tableIdentifier: string) => Promise<void>
}
