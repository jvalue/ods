import { Format } from "./enum/Format";

export class FormatConfig {
    format:Format;
    parameters: Record<string, unknown> | undefined;
    constructor(format: Format, parameters: Record<string, unknown>) {
      this.format = format;
      this.parameters = parameters;
    }
  }
