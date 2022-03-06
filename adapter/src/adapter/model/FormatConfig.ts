import { Format } from "./enum/Format";

export class FormatConfig {
    format:Format;
    parameters: Map<string, unknown>;
    constructor(format: Format, parameters: Map<string, unknown>) {
      this.format = format;
      this.parameters = parameters;
    }
  }
