import { PipelineConfig, PipelineConfigDTO } from './model/pipelineConfig'

export default interface PipelineConfigRepository {
  create: (config: PipelineConfigDTO) => Promise<PipelineConfig>
  get: (id: number) => Promise<PipelineConfig | undefined>
  getAll: () => Promise<PipelineConfig[]>
  getByDatasourceId: (datasourceId: number) => Promise<PipelineConfig[]>
  update: (id: number, config: PipelineConfigDTO) => Promise<void>
  delete: (id: number) => Promise<PipelineConfig>
  deleteAll: () => Promise<PipelineConfig[]>
}
