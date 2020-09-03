import { isObject, isNumber, isString, hasProperty } from '../../validators'

export interface PipelineConfigTriggerRequestAmpq {
  datasourceId: number;
  data: string;
}

export class PipelineConfigTriggerRequestAmqpValidator {
  private errors: string[] = []

  validate (requestBody: unknown): requestBody is PipelineConfigTriggerRequestAmpq {
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
    if (!hasProperty(requestBody, 'data')) {
      this.errors.push('\'data\' property is missing')
    } else if (!isString(requestBody.data)) {
      this.errors.push('\'data\' must be a string')
    }
    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
