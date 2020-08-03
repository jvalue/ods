import PipelineConfig from "./model/pipelineConfig";

export default interface PipelineConfigRepository {
  create(config: PipelineConfig): Promise<PipelineConfig>;
  get(id: number): Promise<PipelineConfig | undefined>;
  getAll(): Promise<PipelineConfig[]>;
  getByDatasourceId(datasourceId: number): Promise<PipelineConfig[]>;
  update(id: number, config: PipelineConfig): Promise<void>;
  delete(id: number): Promise<PipelineConfig>;
  deleteAll(): Promise<PipelineConfig[]>;
}
