import {
  FormatConfigDTO,
  ProtocolConfigDTO,
} from '../../adapter/api/AdapterConfig.dto';

export interface DatasourceConfigDTO {
  id: number;
  protocol: ProtocolConfigDTO;
  format: FormatConfigDTO;
  trigger: TriggerConfigDTO;
  metadata: MetadataConfigDTO;
  schema: SchemaConfigDTO;
}

export interface TriggerConfigDTO {
  firstExecution: Date;
  periodic: boolean;
  interval: number;
}
export interface MetadataConfigDTO {
  author: string;
  license: string;
  displayName: string;
  description: string;
}
export interface SchemaConfigDTO {
  test: number;
}
