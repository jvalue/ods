import { Interpreter } from '../interpreter';

export interface FormatConfig {
  format: Interpreter;
  parameters: Record<string, unknown>;
}
