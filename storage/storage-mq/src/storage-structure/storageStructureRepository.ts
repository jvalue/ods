export interface StorageStructureRepository {
  create: (tableIdentifier: string) => Promise<void>
  delete: (tableIdentifier: string) => Promise<void>
}
