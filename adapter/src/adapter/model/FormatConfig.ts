import { Format } from './enum/Format';

export interface FormatConfig {
  format: Format;
  parameters: Record<string, unknown>;
}
