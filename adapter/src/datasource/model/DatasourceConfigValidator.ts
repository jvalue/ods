import { validators } from '@jvalue/node-dry-basics';

import { DatasourceConfigDTO } from './DatasourceConfig.dto';

export class DatasourceConfigValidator {
  private errors: string[] = [];

  /**
   * Validates the datasource configuration (guard function)
   *
   * @param request the adapter configuration data object
   * @returns false, if an error is found
   * @returns true if no error is found
   */
  validate(request: DatasourceConfigDTO): request is DatasourceConfigDTO {
    this.errors = [];
    if (!validators.isObject(request)) {
      this.errors.push("'Datasource' must be an object");
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
    if (!validators.hasProperty(request, 'trigger')) {
      this.errors.push("'trigger' property is missing");
    } else if (!validators.isObject(request.trigger)) {
      this.errors.push("'trigger' must be an object or array");
    }
    if (!validators.hasProperty(request, 'metadata')) {
      this.errors.push("'metadata' property is missing");
    } else if (!validators.isObject(request.metadata)) {
      this.errors.push("'metadata' must be an object or array");
    }
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}
