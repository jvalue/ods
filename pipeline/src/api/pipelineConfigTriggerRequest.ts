import { validators } from '@jvalue/node-dry-basics';

export interface PipelineConfigTriggerRequest {
  datasourceId: number;
  data: string;
}

export class PipelineConfigTriggerRequestValidator {
  private errors: string[] = [];

  validate(requestBody: unknown): requestBody is PipelineConfigTriggerRequest {
    this.errors = [];
    if (!validators.isObject(requestBody)) {
      this.errors.push("'PipelineConfigTriggerRequest' must be an object");
      return false;
    }
    if (!validators.hasProperty(requestBody, 'datasourceId')) {
      this.errors.push("'datasourceId' property is missing");
    } else if (!validators.isNumber(requestBody.datasourceId)) {
      this.errors.push("'datasourceId' must be a number");
    }
    if (!validators.hasProperty(requestBody, 'data')) {
      this.errors.push("'data' property is missing");
    } else if (!validators.isString(requestBody.data)) {
      this.errors.push("'data' must be a string");
    }
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }
}
