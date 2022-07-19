import { Format } from '../Format';

export interface FormatConfig {
  format: Format;
  parameters: Record<string, unknown>;
}
