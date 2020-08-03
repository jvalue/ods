import PipelineExecutor from "../pipeline-execution/pipelineExecutor";
import { ExecutionResultPublisher } from "./publisher/executionResultPublisher";
import PipelineConfigRepository from "./pipelineConfigRepository";
import PipelineConfig from "./model/pipelineConfig";
import ConfigWritesPublisher from "./publisher/configWritesPublisher";

export class PipelineConfigManager {

  private pipelineExecutor: PipelineExecutor
  private pipelineConfigRepository: PipelineConfigRepository;
  private configWritesPublisher: ConfigWritesPublisher;
  private executionResultPublisher: ExecutionResultPublisher

  constructor(pipelineConfigRepository: PipelineConfigRepository, pipelineExecutor: PipelineExecutor, configWritesPublisher: ConfigWritesPublisher, executionResultPublisher: ExecutionResultPublisher) {
    this.pipelineConfigRepository = pipelineConfigRepository
    this.pipelineExecutor = pipelineExecutor
    this.configWritesPublisher = configWritesPublisher
    this.executionResultPublisher = executionResultPublisher
  }

  create(config: PipelineConfig): Promise<PipelineConfig> {
    return this.pipelineConfigRepository.create(config)
  }

  get(id: number): Promise<PipelineConfig | undefined> {
    return this.pipelineConfigRepository.get(id)
  }

  getAll(): Promise<PipelineConfig[]> {
    return this.pipelineConfigRepository.getAll()
  }

  getByDatasourceId(datasourceId: number): Promise<PipelineConfig[]> {
    return this.pipelineConfigRepository.getByDatasourceId(datasourceId)
  }

  update(id: number, config: PipelineConfig): Promise<void> {
    return this.pipelineConfigRepository.update(id, config)
  }

  delete(id: number): Promise<void> {
    return this.pipelineConfigRepository.delete(id)
  }

  deleteAll(): Promise<void> {
    return this.pipelineConfigRepository.deleteAll()
  }

  triggerConfig(pipelineId: number, pipelineName: string, func: string, data: object) {
    const result = this.pipelineExecutor.executeJob(func, data)

    if(result.error) {
      this.executionResultPublisher.publishError(pipelineId, pipelineName, result.error.message)
    } else if(result.data) {
      this.executionResultPublisher.publishSuccess(pipelineId, pipelineName, result.data)
    } else {
      console.error(`Pipeline ${pipelineId} executed with ambiguous result: no data and no error!`)
    }
  }
}
