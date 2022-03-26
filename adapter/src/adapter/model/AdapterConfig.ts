import { FormatConfig } from "./FormatConfig";
import { ProtocolConfig } from "./ProtocolConfig";
import { validators } from '@jvalue/node-dry-basics';
import { JsonAlias, JsonClassType, JsonProperty } from "jackson-js";

export interface AdapterConfig {
  protocolConfig: ProtocolConfig;
  formatConfig: FormatConfig;
}

export class AdapterConfigValidator {
  private errors: string[] = [];

  validate(request: unknown): request is AdapterConfig {
    this.errors = [];
    if (!validators.isObject(request)) {
      this.errors.push("'AdapterConfig' must be an object");
      return false;
    }
    if (!validators.hasProperty(request, 'protocol')) {
      this.errors.push("'protocol' property is missing");
    } else if (!validators.isObject(request.protocol)) {
      this.errors.push("'protocol' must be a string");
    }
    if (!validators.hasProperty(request, 'format')) {
      this.errors.push("'format' property is missing");
    } else if (!validators.isObject(request.format)) {
      this.errors.push("'format' must be an object or array");
    }
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}