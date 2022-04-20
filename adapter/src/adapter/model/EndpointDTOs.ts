export interface AdapterConfigDTO {
  protocol: ProtocolConfigDTO;
  format: FormatConfigDTO;
}

export interface ProtocolConfigDTO {
  type: string;
  parameters: Record<string, unknown>;
}

export interface FormatConfigDTO {
  type: string;
  parameters: Record<string, unknown>;
}

/* Export interface FormatParameterDTO {
  location: string;
  encoding: string;
}

export interface ProtocolParameterDTO {
  type: string;
  parameters: Record<string, unknown>;
}*/
