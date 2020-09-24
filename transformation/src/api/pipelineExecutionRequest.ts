import { hasProperty, isObject, isString } from '../validators'

export interface PipelineExecutionRequest {
  func: string
  data: object
}

export class PipelineExecutionRequestValidator {
  private errors: string[] = []

  validate (request: unknown): request is PipelineExecutionRequest {
    this.errors = []
    if (!isObject(request)) {
      this.errors.push('\'PipelineExecutionRequest\' must be an object')
      return false
    }
    if (!hasProperty(request, 'func')) {
      // Missing transformation func is not an error, assume identity transformation
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (request as PipelineExecutionRequest).func = 'return data;'
    } else if (!isString(request.func)) {
      this.errors.push('\'func\' must be a string')
    }
    if (!hasProperty(request, 'data')) {
      this.errors.push('\'data\' property is missing')
    } else if (!isObject(request.data)) {
      this.errors.push('\'data\' must be an object or array')
    }
    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
