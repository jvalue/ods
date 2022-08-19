export interface DatasourceEntity {
  id: number;
  format_parameters: string;
  format_type: string;
  author: string;
  creation_timestamp: Date;
  description: string;
  display_name: string;
  license: string;
  protocol_parameters: string;
  protocol_type: string;
  schema: Record<string, unknown>;
  first_execution: Date;
  interval: number;
  periodic: boolean;
}
