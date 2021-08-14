export interface StorageStructureRepository {
  create: (tableIdentifier: string) => Promise<void>
  createForSchema: (schema: any, tableName: string) => Promise<void>
  delete: (tableIdentifier: string) => Promise<void>
}
