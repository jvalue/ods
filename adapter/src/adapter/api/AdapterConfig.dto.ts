import { validators } from '@jvalue/node-dry-basics';

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

export class AdapterConfigValidator {
  private errors: string[] = [];

  /**
   * Validates the format configuration (guard function)
   *
   * @param request the adapter configuration data object
   * @returns false, if an error is found
   * @returns true if no error is found
   */
  validate(request: unknown): request is AdapterConfigDTO {
    this.errors = [];
    if (!validators.isObject(request)) {
      this.errors.push("'AdapterConfig' must be an object");
      return false;
    }
    if (!validators.hasProperty(request, 'protocol')) {
      this.errors.push("'protocol' property is missing");
    } else if (!validators.isObject(request.protocol)) {
      this.errors.push("'protocol' must be a string");
    } else {
      const protocolValidator = new ProtocolConfigValidator();
      protocolValidator.validate(request.protocol);
      this.errors.push(...protocolValidator.getErrors());
    }
    if (!validators.hasProperty(request, 'format')) {
      this.errors.push("'format' property is missing");
    } else if (!validators.isObject(request.format)) {
      this.errors.push("'format' must be an object or array");
    } else {
      const formatValidator = new FormatConfigValidator();
      formatValidator.validate(request.format);
      this.errors.push(...formatValidator.getErrors());
    }

    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}

export class ProtocolConfigValidator {
  private errors: string[] = [];

  /**
   * Validates the protocol configuration (guard function)
   *
   * @param request the protocol configuration data object
   * @returns false, if an error is found
   * @returns true if no error is found
   */
  validate(request: unknown): request is ProtocolConfigDTO {
    this.errors = [];

    if (!validators.isObject(request)) {
      this.errors.push("'ProtocolConfig' must be an object");
      return false;
    }
    if (!validators.hasProperty(request, 'type')) {
      this.errors.push("'type' property is missing");
    } else if (!validators.isString(request.type)) {
      this.errors.push("'type' must be a string");
    }
    if (!validators.hasProperty(request, 'parameters')) {
      this.errors.push("'parameters' property is missing");
    } else if (!validators.isObject(request.parameters)) {
      this.errors.push("'parameters' must be an object or array");
    }
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}

export class FormatConfigValidator {
  private errors: string[] = [];

  /**
   * Validates the format configuration (guard function)
   *
   * @param request the format configuration data object
   * @returns false, if an error is found
   * @returns true if no error is found
   */
  validate(request: unknown): request is FormatConfigDTO {
    this.errors = [];

    if (!validators.isObject(request)) {
      this.errors.push("'FormatConfig' must be an object");
      return false;
    }
    if (!validators.hasProperty(request, 'type')) {
      this.errors.push("'type' property is missing");
    } else if (!validators.isString(request.type)) {
      this.errors.push("'type' must be a string");
    }
    if (!validators.hasProperty(request, 'parameters')) {
      this.errors.push("'parameters' property is missing");
    } else if (!validators.isObject(request.parameters)) {
      this.errors.push("'parameters' must be an object or array");
    }
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}
