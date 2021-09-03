/* eslint-env jest */
import { PipelineConfigDTOValidator } from './pipelineConfig';

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

interface TestRequestType<MetaData, Transformation> {
  datasourceId: number | string;
  transformation: Transformation;
  metadata: MetaData;
}

interface TestRequestMetaDataType {
  author: string | number;
  license: string | number;
  displayName: string | number;
  description: string | number;
}

interface TestRequestTransformationType {
  func: string | number;
}

const validPipelineConfig = (): TestRequestType<
  TestRequestMetaDataType | string,
  TestRequestTransformationType | string
> => ({
  datasourceId: 1,
  transformation: {
    func: 'return data+data;',
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test pipeline',
    description: 'integration testing pipeline',
  },
});
const validPipelineConfigNoObjectString = (): TestRequestType<
  TestRequestMetaDataType,
  TestRequestTransformationType
> => ({
  datasourceId: 1,
  transformation: {
    func: 'return data+data;',
  },
  metadata: {
    author: 'icke',
    license: 'none',
    displayName: 'test pipeline',
    description: 'integration testing pipeline',
  },
});

describe('PipelineConfigDTOValidator', () => {
  let validator: PipelineConfigDTOValidator;

  beforeAll(() => {
    validator = new PipelineConfigDTOValidator();
  });

  test('should reject undefined', () => {
    expect(validator.validate(undefined)).toBeFalsy();
  });

  test('should reject empty object and array', () => {
    expect(validator.validate([])).toBeFalsy();
    expect(validator.validate({})).toBeFalsy();
  });

  test('should reject missing or invalid datasourceId', () => {
    const missingDatasourceIdConfig: DeepPartial<
      TestRequestType<TestRequestMetaDataType | string, TestRequestTransformationType | string>
    > = validPipelineConfig();
    delete missingDatasourceIdConfig.datasourceId;
    expect(validator.validate(missingDatasourceIdConfig)).toBeFalsy();

    const invalidDatasourceIdConfig = validPipelineConfig();
    invalidDatasourceIdConfig.datasourceId = '';
    expect(validator.validate(invalidDatasourceIdConfig)).toBeFalsy();
  });

  test('should reject missing or invalid metadata', () => {
    const missingMetadataConfig: DeepPartial<
      TestRequestType<TestRequestMetaDataType | string, TestRequestTransformationType | string>
    > = validPipelineConfig();
    delete missingMetadataConfig.metadata;
    expect(validator.validate(missingMetadataConfig)).toBeFalsy();

    const invalidMetadataConfig = validPipelineConfig();
    invalidMetadataConfig.metadata = '';
    expect(validator.validate(invalidMetadataConfig)).toBeFalsy();

    const missingMetadataPropertiesConfig: DeepPartial<
      TestRequestType<TestRequestMetaDataType | string, TestRequestTransformationType | string>
    > = validPipelineConfig();
    missingMetadataPropertiesConfig.metadata = {};
    expect(validator.validate(missingMetadataPropertiesConfig)).toBeFalsy();

    const invalidMetadataAuthorConfig = validPipelineConfigNoObjectString();
    invalidMetadataAuthorConfig.metadata.author = 123;
    expect(validator.validate(invalidMetadataAuthorConfig)).toBeFalsy();

    const invalidMetadataDisplayNameConfig = validPipelineConfigNoObjectString();
    invalidMetadataDisplayNameConfig.metadata.displayName = 123;
    expect(validator.validate(invalidMetadataDisplayNameConfig)).toBeFalsy();

    const invalidMetadataLicenseConfig = validPipelineConfigNoObjectString();
    invalidMetadataLicenseConfig.metadata.license = 123;
    expect(validator.validate(invalidMetadataLicenseConfig)).toBeFalsy();

    const invalidMetadataDescriptionConfig = validPipelineConfigNoObjectString();
    invalidMetadataDescriptionConfig.metadata.description = 123;
    expect(validator.validate(invalidMetadataDescriptionConfig)).toBeFalsy();
  });

  test('should reject invalid transformation function', () => {
    const missingPipelineFuncConfig: TestRequestType<
      TestRequestMetaDataType,
      Partial<TestRequestTransformationType>
    > = validPipelineConfigNoObjectString();
    delete missingPipelineFuncConfig.transformation.func;
    expect(validator.validate(missingPipelineFuncConfig)).toBeFalsy();

    const invalidPipelineConfig = validPipelineConfig();
    invalidPipelineConfig.transformation = '';
    expect(validator.validate(invalidPipelineConfig)).toBeFalsy();

    const invalidPipelineFuncConfig = validPipelineConfigNoObjectString();
    invalidPipelineFuncConfig.transformation.func = 123;
    expect(validator.validate(invalidPipelineFuncConfig)).toBeFalsy();
  });

  test('should add default identity transformation function', () => {
    const pipelineConfig: TestRequestType<TestRequestMetaDataType, TestRequestTransformationType | undefined> =
      validPipelineConfigNoObjectString();
    delete pipelineConfig.transformation;

    const validationResult = validator.validate(pipelineConfig);
    expect(validationResult).toBeTruthy();
    // Changed to toHaveProperty due to otherwise type error: "func does not exists in type never" caused by delete pipelineConfig.transformation;
    expect(pipelineConfig.transformation).toHaveProperty('func', 'return data;');
  });

  test('should accept valid pipeline config', () => {
    expect(validator.validate(validPipelineConfig())).toBeTruthy();
  });
});
