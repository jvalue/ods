
export interface StorageStructureRepository {
  init(retries: number, backoff: number): Promise<void>

  create(tableIdentifier: string): Promise<void>
  delete(tableIdentifier: string): Promise<void>
}
