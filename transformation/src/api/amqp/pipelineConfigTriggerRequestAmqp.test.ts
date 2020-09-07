/* eslint-env jest */
import { PipelineConfigTriggerRequestAmqpValidator } from './pipelineConfigTriggerRequestAmpq'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validTriggerRequest = (): any => ({
  datasourceId: 123,
  data: '{}'
})

describe('PipelineConfigTriggerRequestValidator', () => {
  let validator: PipelineConfigTriggerRequestAmqpValidator

  beforeAll(() => {
    validator = new PipelineConfigTriggerRequestAmqpValidator()
  })

  test('should reject undefined', () => {
    expect(validator.validate(undefined)).toBeFalsy()
  })

  test('should reject empty object and array', () => {
    expect(validator.validate([])).toBeFalsy()
    expect(validator.validate({})).toBeFalsy()
  })

  test('should reject missing or invalid datasourceId', () => {
    const missingDatasourceIdRequest = validTriggerRequest()
    delete missingDatasourceIdRequest.datasourceId
    expect(validator.validate(missingDatasourceIdRequest)).toBeFalsy()

    const invalidDatasourceIdRequest = validTriggerRequest()
    invalidDatasourceIdRequest.datasourceId = ''
    expect(validator.validate(invalidDatasourceIdRequest)).toBeFalsy()
  })

  test('should reject invalid data', () => {
    const invalidDataRequest = validTriggerRequest()
    invalidDataRequest.data = 123
    expect(validator.validate(invalidDataRequest)).toBeFalsy()
  })

  test('should reject missing data', () => {
    const invalidRequest = validTriggerRequest()
    delete invalidRequest.data
    expect(validator.validate(invalidRequest)).toBeFalsy()
  })

  test('should accept valid trigger request', () => {
    expect(validator.validate(validTriggerRequest())).toBeTruthy()
  })
})
