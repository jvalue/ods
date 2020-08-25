/* eslint-env jest */
import { PipelineConfigTriggerRequestValidator } from './pipelineConfigTriggerRequest'

describe('PipelineConfigTriggerRequestValidator', () => {
  test('should reject invalid trigger request', () => {
    const validator = new PipelineConfigTriggerRequestValidator()
    expect(validator.validate(undefined)).toBeFalsy()
    expect(validator.validate([])).toBeFalsy()
    expect(validator.validate({})).toBeFalsy()
    expect(validator.validate({ datasourceId: 'bar' })).toBeFalsy()
    expect(validator.validate({ datasourceId: 123, data: 'foo' })).toBeFalsy()
    expect(validator.validate({ datasourceId: 123, data: 'foo' })).toBeFalsy()
  })

  test('should accept valid trigger request', () => {
    const validator = new PipelineConfigTriggerRequestValidator()
    expect(validator.validate({ datasourceId: 123, data: {} })).toBeTruthy()
    expect(validator.validate({ datasourceId: 123, dataLocation: 'foo' })).toBeTruthy()
    expect(validator.validate({ datasourceId: 123, data: {}, dataLocation: 'foo' })).toBeTruthy()
  })
})
