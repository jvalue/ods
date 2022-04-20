import { stringify } from 'querystring';

import { validators } from '@jvalue/node-dry-basics';
import { JsonAlias, JsonClassType, JsonProperty } from 'jackson-js';

import { ProtocolConfigDTO } from './EndpointDTOs';
import { Protocol } from './enum/Protocol';

export interface ProtocolConfig {
  protocol: Protocol;
  parameters: Record<string, unknown>;
}

export class ProtocolConfigValidator {
  private errors: string[] = [];

  validate(request: ProtocolConfigDTO): request is ProtocolConfigDTO {
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
