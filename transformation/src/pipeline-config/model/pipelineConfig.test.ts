/* eslint-env jest */
import { PipelineConfigDTO, PipelineConfigDTOValidator } from './pipelineConfig'

const validPipelineConfig = (): PipelineConfigDTO => ({
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
  test('should reject invalid pipeline config', () => {
    const validator = new PipelineConfigDTOValidator()
    expect(validator.validate(undefined)).toBeFalsy()
    expect(validator.validate([])).toBeFalsy()
    expect(validator.validate({})).toBeFalsy()
    expect(validator.validate({ datasourceId: 1 })).toBeFalsy()
    expect(validator.validate({ metadata: { author: 'icke' } })).toBeFalsy()
    expect(validator.validate({ datasourceId: 1, metadata: { author: 123 } })).toBeFalsy()
    expect(validator.validate({ datasourceId: 1, metadata: { author: 'icke', license: 'foo' } })).toBeFalsy()
    const config = validPipelineConfig()
    delete config.transformation.func
    expect(validator.validate(config)).toBeFalsy()
  })

  test('should add default identity transformation function', () => {
    const validator = new PipelineConfigDTOValidator()
    const pipelineConfig = validPipelineConfig()
    delete pipelineConfig.transformation
    if (validator.validate(pipelineConfig)) {
      expect(pipelineConfig.transformation.func).toBe('return data;')
    } else {
      expect(true).toBeFalsy()
    }
  })

  test('should accept valid pipeline config', () => {
    const validator = new PipelineConfigDTOValidator()
    expect(validator.validate(validPipelineConfig())).toBeTruthy()
  })
})
