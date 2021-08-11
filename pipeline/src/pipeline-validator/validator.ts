import { PipelineConfig } from './../pipeline-config/model/pipelineConfig'
import { PipelineTransformedDataDTO } from './../pipeline-config/model/pipelineTransformedData'

export default interface Validator {
  validate: (config: PipelineConfig, data: unknown) => PipelineTransformedDataDTO
}
