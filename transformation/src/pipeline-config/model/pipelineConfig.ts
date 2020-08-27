import { isObject, isString, isNumber } from '../../validators'

export interface PipelineConfig {
  id: number;
  datasourceId: number;
  transformation: TransformationConfig;
  metadata: Metadata;
}

export interface TransformationConfig {
  func: string;
}

export interface Metadata {
  author: string;
  displayName: string;
  license: string;
  description: string;
  creationTimestamp: Date;
}

/**
 * PipelineConfig data transfer object that clients must use when creating or updating a PipelineConfig
 */
export interface PipelineConfigDTO {
  datasourceId: number;
  transformation: TransformationConfig;
  metadata: MetadataDTO;
}

export interface MetadataDTO {
  author: string;
  displayName: string;
  license: string;
  description: string;
}

export class PipelineConfigDTOValidator {
  private errors: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate (pipelineConfig: any): pipelineConfig is PipelineConfigDTO {
    this.errors = []
    if (!isObject(pipelineConfig)) {
      this.errors.push('\'PipelineConfig\' must be an object')
      return false
    }

    if (!('datasourceId' in pipelineConfig)) {
      this.errors.push('\'datasourceId\' property is missing')
    } else if (!isNumber(pipelineConfig.datasourceId)) {
      this.errors.push('\'datasourceId\' property must be a number')
    }

    if (!('transformation' in pipelineConfig)) {
      // Missing transformation is not an error, assume identity transformation
      pipelineConfig.transformation = { func: 'return data;' }
    } else if (!isObject(pipelineConfig.transformation)) {
      this.errors.push('\'transformation\' property must be an object')
    } else {
      if (!('func' in pipelineConfig.transformation)) {
        this.errors.push('\'transformation.func\' property is missing')
      } else if (!isString(pipelineConfig.transformation.func)) {
        this.errors.push('\'transformation.func\' property must be a string')
      }
    }

    if (!('metadata' in pipelineConfig)) {
      this.errors.push('\'metadata\' property is missing')
    } else if (!isObject(pipelineConfig.metadata)) {
      this.errors.push('\'metadata\' property must be an object')
    } else {
      if (!('author' in pipelineConfig.metadata)) {
        this.errors.push('\'metadata.author\' property is missing')
      } else if (!isString(pipelineConfig.metadata.author)) {
        this.errors.push('\'metadata.author\' property must be a string')
      }

      if (!('displayName' in pipelineConfig.metadata)) {
        this.errors.push('\'metadata.displayName\' property is missing')
      } else if (!isString(pipelineConfig.metadata.displayName)) {
        this.errors.push('\'metadata.displayName\' property must be a string')
      }

      if (!('license' in pipelineConfig.metadata)) {
        this.errors.push('\'metadata.license\' property is missing')
      } else if (!isString(pipelineConfig.metadata.license)) {
        this.errors.push('\'metadata.license\' property must be a string')
      }

      if (!('description' in pipelineConfig.metadata)) {
        this.errors.push('\'metadata.description\' property is missing')
      } else if (!isString(pipelineConfig.metadata.description)) {
        this.errors.push('\'metadata.description\' property must be a string')
      }
    }

    return this.errors.length === 0
  }

  getErrors (): string[] {
    return this.errors
  }
}
