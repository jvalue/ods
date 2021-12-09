export interface StorageStructureRepository {
  create: (tableIdentifier: string) => Promise<void>;
  createForSchema: (
    schema: Record<string, unknown>,
    tableName: string,
  ) => Promise<void>;
  delete: (tableIdentifier: string) => Promise<void>;
}
