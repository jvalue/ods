import { validators } from '@jvalue/node-dry-basics'

export interface PipelineExecutionRequest {
  func: string
  data: object
}

export class PipelineExecutionRequestValidator {
  private errors: string[] = []

  validate (request: unknown): request is PipelineExecutionRequest {
    this.errors = []
    if (!validators.isObject(request)) {
      this.errors.push('\'PipelineExecutionRequest\' must be an object')
      return false
    }
    if (!validators.hasProperty(request, 'func')) {
      // Missing transformation func is not an error, assume identity transformation
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (request as PipelineExecutionRequest).func = 'return data;'
    } else if (!validators.isString(request.func)) {
      this.errors.push('\'func\' must be a string')
    }
    if (!validators.hasProperty(request, 'data')) {
      this.errors.push('\'data\' property is missing')
    } else if (!validators.isObject(request.data)) {
      this.errors.push('\'data\' must be an object or array')
    }
    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
