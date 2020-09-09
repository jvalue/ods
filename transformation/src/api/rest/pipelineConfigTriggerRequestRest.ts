import { isObject, isNumber, hasProperty } from '../../validators'

export interface PipelineConfigTriggerRequestRest {
  datasourceId: number;
  data: object;
}

export class PipelineConfigTriggerRequestRestValidator {
  private errors: string[] = []

  validate (requestBody: unknown): requestBody is PipelineConfigTriggerRequestRest {
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
    } else if (!isObject(requestBody.data)) {
      this.errors.push('\'data\' must be an object or array')
    }
    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
