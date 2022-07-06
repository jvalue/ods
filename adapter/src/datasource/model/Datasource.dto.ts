import { DatasourceEntity } from './Datasource.entity';

export interface DatasourceDTO {
  id: number;
  schema: Record<string, unknown>;
  protocol: { type: string; parameters: Record<string, unknown> };
  metadata: {
    license: string;
    author: string;
    displayName: string;
    creationTimestamp: Date;
    description: string;
  };
  format: { type: string; parameters: Record<string, unknown> };
  trigger: { periodic: boolean; interval: number; firstExecution: Date };
}

export function datasourceEntityToDTO(entity: DatasourceEntity): DatasourceDTO {
  return {
    id: entity.id,
    protocol: {
      type: entity.protocol_type,
      parameters: JSON.parse(entity.protocol_parameters) as Record<
        string,
        unknown
      >,
    },
    format: {
      type: entity.format_type,
      parameters: JSON.parse(entity.format_parameters) as Record<
        string,
        unknown
      >,
    },
    metadata: {
      author: entity.author,
      license: entity.license,
      displayName: entity.display_name,
      description: entity.description,
      creationTimestamp: entity.creation_timestamp,
    },
    trigger: {
      periodic: entity.periodic,
      firstExecution: entity.first_execution,
      interval: entity.interval,
    },
    schema: entity.schema,
  };
}
