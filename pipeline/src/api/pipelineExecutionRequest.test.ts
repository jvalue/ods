/* eslint-env jest */
import { PipelineExecutionRequestValidator } from './pipelineExecutionRequest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validPipelineRequest = (): any => ({
  func: 'return data + data;',
  data: {}
})

describe('PipelineExecutionRequestValidator', () => {
  let validator: PipelineExecutionRequestValidator

  beforeAll(() => {
    validator = new PipelineExecutionRequestValidator()
  })

  test('should reject undefined', () => {
    expect(validator.validate(undefined)).toBeFalsy()
    expect(validator.getErrors().length).toBeGreaterThan(0)
  })

  test('should reject empty object and array', () => {
    expect(validator.validate([])).toBeFalsy()
    expect(validator.getErrors().length).toBeGreaterThan(0)
    expect(validator.validate({})).toBeFalsy()
    expect(validator.getErrors().length).toBeGreaterThan(0)
  })

  test('should reject invalid data', () => {
    const invalidDataRequest = validPipelineRequest()
    invalidDataRequest.data = 123
    expect(validator.validate(invalidDataRequest)).toBeFalsy()
    expect(validator.getErrors().length).toBeGreaterThan(0)
  })

  test('should reject missing data', () => {
    const invalidRequest = validPipelineRequest()
    delete invalidRequest.data
    expect(validator.validate(invalidRequest)).toBeFalsy()
    expect(validator.getErrors().length).toBeGreaterThan(0)
  })

  test('should reject invalid transformation function', () => {
    const invalidFuncConfig = validPipelineRequest()
    invalidFuncConfig.func = 123
    expect(validator.validate(invalidFuncConfig)).toBeFalsy()
    expect(validator.getErrors().length).toBeGreaterThan(0)
  })

  test('should add default identity transformation function', () => {
    const request = validPipelineRequest()
    delete request.func

    const validationResult = validator.validate(request)
    expect(validationResult).toBeTruthy()
    expect(validator.getErrors().length).toEqual(0)
    expect(request.func).toBe('return data;')
  })

  test('should accept valid trigger request', () => {
    expect(validator.validate(validPipelineRequest())).toBeTruthy()
    expect(validator.getErrors().length).toEqual(0)
  })
})
