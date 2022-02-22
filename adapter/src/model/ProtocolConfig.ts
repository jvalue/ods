import { Protocol } from "./enum/Protocol";

export interface ProtocolConfig {
    
    protocol:Protocol;
    parameters: Map<string, any> | undefined;
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
  