import { Importer } from './importer';
import { Interpreter } from './interpreter';

export interface AdapterConfig {
  protocolConfig: ProtocolConfig;
  formatConfig: FormatConfig;
}

export interface FormatConfig {
  format: Interpreter;
  parameters: Record<string, unknown>;
}

export interface ProtocolConfig {
  protocol: Importer;
  parameters: Record<string, unknown>;
}
