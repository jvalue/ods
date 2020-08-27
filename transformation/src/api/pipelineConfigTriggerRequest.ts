import { isObject, isNumber, isString } from '../validators'

export interface PipelineConfigTriggerRequest {
  datasourceId: number;

  data: object;
  dataLocation: string;
}

export class PipelineConfigTriggerRequestValidator {
  private errors: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate (requestBody: any): requestBody is PipelineConfigTriggerRequest {
    this.errors = []
    if (!isObject(requestBody)) {
      this.errors.push('\'PipelineConfigTriggerRequest\' must be an object')
      return false
    }
    if (!('datasourceId' in requestBody)) {
      this.errors.push('\'datasourceId\' property is missing')
    } else if (!isNumber(requestBody.datasourceId)) {
      this.errors.push('\'datasourceId\' must be a number')
    }
    if ('data' in requestBody && !isObject(requestBody.data)) {
      this.errors.push('\'data\' must be an object or array')
    }
    if ('dataLocation' in requestBody && !isString(requestBody.dataLocation)) {
      this.errors.push('\'dataLocation\' must be a string')
    }
    if (!('data' in requestBody) && !('dataLocation' in requestBody)) {
      this.errors.push('either \'data\' or \'dataLocation\' must be present')
    }
    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
