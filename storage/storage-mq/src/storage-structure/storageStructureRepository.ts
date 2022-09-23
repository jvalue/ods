import { JsonSchemaElementBase } from '../service/sharedHelper';

export interface StorageStructureRepository {
  create: (tableIdentifier: string) => Promise<void>;
  createForSchema: (
    schema: JsonSchemaElementBase,
    tableName: string,
  ) => Promise<void>;
  delete: (tableIdentifier: string) => Promise<void>;
}
