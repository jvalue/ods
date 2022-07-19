import { validators } from '@jvalue/node-dry-basics';

import { AdapterConfigDTO } from './Endpoint.dto';
import { FormatConfig } from './FormatConfig';
import { ProtocolConfig } from './ProtocolConfig';

export interface AdapterConfig {
  protocolConfig: ProtocolConfig;
  formatConfig: FormatConfig;
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
  validate(request: AdapterConfigDTO): request is AdapterConfigDTO {
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
