/* eslint-env jest */
import { PipelineConfigDTOValidator } from './pipelineConfig'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const validPipelineConfig = (): any => ({
  datasourceId: 1,
  transformation: {
    func: 'return data+data;'
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test pipeline',
    description: 'integration testing pipeline'
  }
})

describe('PipelineConfigDTOValidator', () => {
  let validator: PipelineConfigDTOValidator

  beforeAll(() => {
    validator = new PipelineConfigDTOValidator()
  })

  test('should reject undefined', () => {
    expect(validator.validate(undefined)).toBeFalsy()
  })

  test('should reject empty object and array', () => {
    expect(validator.validate([])).toBeFalsy()
    expect(validator.validate({})).toBeFalsy()
  })

  test('should reject missing or invalid datasourceId', () => {
    const missingDatasourceIdConfig = validPipelineConfig()
    delete missingDatasourceIdConfig.datasourceId
    expect(validator.validate(missingDatasourceIdConfig)).toBeFalsy()

    const invalidDatasourceIdConfig = validPipelineConfig()
    invalidDatasourceIdConfig.datasourceId = ''
    expect(validator.validate(invalidDatasourceIdConfig)).toBeFalsy()
  })

  test('should reject missing or invalid metadata', () => {
    const missingMetadataConfig = validPipelineConfig()
    delete missingMetadataConfig.metadata
    expect(validator.validate(missingMetadataConfig)).toBeFalsy()

    const invalidMetadataConfig = validPipelineConfig()
    invalidMetadataConfig.metadata = ''
    expect(validator.validate(invalidMetadataConfig)).toBeFalsy()

    const missingMetadataPropertiesConfig = validPipelineConfig()
    missingMetadataPropertiesConfig.metadata = {}
    expect(validator.validate(missingMetadataPropertiesConfig)).toBeFalsy()

    const invalidMetadataAuthorConfig = validPipelineConfig()
    invalidMetadataAuthorConfig.metadata.author = 123
    expect(validator.validate(invalidMetadataAuthorConfig)).toBeFalsy()

    const invalidMetadataDisplayNameConfig = validPipelineConfig()
    invalidMetadataDisplayNameConfig.metadata.displayName = 123
    expect(validator.validate(invalidMetadataDisplayNameConfig)).toBeFalsy()

    const invalidMetadataLicenseConfig = validPipelineConfig()
    invalidMetadataLicenseConfig.metadata.license = 123
    expect(validator.validate(invalidMetadataLicenseConfig)).toBeFalsy()

    const invalidMetadataDescriptionConfig = validPipelineConfig()
    invalidMetadataDescriptionConfig.metadata.description = 123
    expect(validator.validate(invalidMetadataDescriptionConfig)).toBeFalsy()
  })

  test('should reject invalid transformation function', () => {
    const missingTransformationFuncConfig = validPipelineConfig()
    delete missingTransformationFuncConfig.transformation.func
    expect(validator.validate(missingTransformationFuncConfig)).toBeFalsy()

    const invalidTransformationConfig = validPipelineConfig()
    invalidTransformationConfig.transformation = ''
    expect(validator.validate(invalidTransformationConfig)).toBeFalsy()

    const invalidTransformationFuncConfig = validPipelineConfig()
    invalidTransformationFuncConfig.transformation.func = 123
    expect(validator.validate(invalidTransformationFuncConfig)).toBeFalsy()
  })

  test('should add default identity transformation function', () => {
    const pipelineConfig = validPipelineConfig()
    delete pipelineConfig.transformation

    const validationResult = validator.validate(pipelineConfig)
    expect(validationResult).toBeTruthy()
    expect(pipelineConfig.transformation.func).toBe('return data;')
  })

  test('should accept valid pipeline config', () => {
    expect(validator.validate(validPipelineConfig())).toBeTruthy()
  })
})
