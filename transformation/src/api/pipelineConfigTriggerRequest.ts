import { isObject, isNumber, isString, hasProperty } from '../validators'

export interface PipelineConfigTriggerRequest {
  datasourceId: number;

  data: string;
  dataLocation: string;
}

export class PipelineConfigTriggerRequestValidator {
  private errors: string[] = []

  validate (requestBody: unknown): requestBody is PipelineConfigTriggerRequest {
    this.errors = []
    if (!isObject(requestBody)) {
      this.errors.push('\'PipelineConfigTriggerRequest\' must be an object')
      return false
    }
    if (!hasProperty(requestBody, 'datasourceId')) {
      this.errors.push('\'datasourceId\' property is missing')
    } else if (!isNumber(requestBody.datasourceId)) {
      this.errors.push('\'datasourceId\' must be a number')
    }
    if (hasProperty(requestBody, 'data') && !isObject(requestBody.data)) {
      this.errors.push('\'data\' must be an object or array')
    }
    if (hasProperty(requestBody, 'dataLocation') && !isString(requestBody.dataLocation)) {
      this.errors.push('\'dataLocation\' must be a string')
    }
    if (!hasProperty(requestBody, 'data') && !hasProperty(requestBody, 'dataLocation')) {
      this.errors.push('either \'data\' or \'dataLocation\' must be present')
    }
    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
