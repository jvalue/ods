import { validators } from '@jvalue/node-dry-basics';

import { AdapterConfigDTO } from '../api/Endpoint.dto';
import { Protocol } from '../Protocol';

export interface ProtocolConfig {
  protocol: Protocol;
  parameters: Record<string, unknown>;
}

export class ProtocolConfigValidator {
  private errors: string[] = [];

  /**
   * Validates the protocol configuration (guard function)
   *
   * @param request the adapter configuration data object
   * @returns false, if an error is found
   * @returns true if no error is found
   */
  validate(request: AdapterConfigDTO): request is AdapterConfigDTO {
    this.errors = [];

    if (!validators.isObject(request)) {
      this.errors.push("'ProtocolConfig' must be an object");
      return false;
    }
    if (!validators.hasProperty(request.protocol, 'type')) {
      this.errors.push("'type' property is missing");
    } else if (!validators.isString(request.protocol.type)) {
      this.errors.push("'type' must be a string");
    }
    if (!validators.hasProperty(request.protocol, 'parameters')) {
      this.errors.push("'parameters' property is missing");
    } else if (!validators.isObject(request.protocol.parameters)) {
      this.errors.push("'parameters' must be an object or array");
    }
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}
