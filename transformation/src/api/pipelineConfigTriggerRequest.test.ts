/* eslint-env jest */
import { PipelineConfigTriggerRequestValidator } from './pipelineConfigTriggerRequest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validTriggerRequest = (): any => ({
  datasourceId: 123,
  data: {},
  dataLocation: 'foo'
})

describe('PipelineConfigTriggerRequestValidator', () => {
  let validator: PipelineConfigTriggerRequestValidator

  beforeAll(() => {
    validator = new PipelineConfigTriggerRequestValidator()
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

  test('should reject invalid dataLocation', () => {
    const invalidDataLocationRequest = validTriggerRequest()
    invalidDataLocationRequest.dataLocation = 123
    expect(validator.validate(invalidDataLocationRequest)).toBeFalsy()
  })

  test('should reject missing data and dataLocation', () => {
    const invalidRequest = validTriggerRequest()
    delete invalidRequest.data
    delete invalidRequest.dataLocation
    expect(validator.validate(invalidRequest)).toBeFalsy()
  })

  test('should accept valid trigger request', () => {
    expect(validator.validate(validTriggerRequest())).toBeTruthy()

    const requestWithMissingData = validTriggerRequest()
    delete requestWithMissingData.data
    expect(validator.validate(requestWithMissingData)).toBeTruthy()

    const requestWithMissingDataLocation = validTriggerRequest()
    delete requestWithMissingDataLocation.dataLocation
    expect(validator.validate(requestWithMissingDataLocation)).toBeTruthy()
  })
})
