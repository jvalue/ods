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

  async create(config: PipelineConfig): Promise<PipelineConfig> {
    const savedConfig = await this.pipelineConfigRepository.create(config)
    const success = this.configWritesPublisher.publishCreation(savedConfig.id, savedConfig.metadata.displayName)
    if(!success) {
      console.error(`Saved pipeline ${savedConfig.id} but was not able to publish success. Error handling not implemented!`)
    }
    return savedConfig
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

  async update(id: number, config: PipelineConfig): Promise<void> {
    await this.pipelineConfigRepository.update(id, config)
    const success = this.configWritesPublisher.publishUpdate(id, config.metadata.displayName)
    if(!success) {
      console.error(`Updated pipeline ${id} but was not able to publish success. Error handling not implemented!`)
    }
    return Promise.resolve()
  }

  async delete(id: number): Promise<void> {
    const deletedPipeline = await this.pipelineConfigRepository.delete(id)
    const success = this.configWritesPublisher.publishDeletion(id, deletedPipeline.metadata.displayName)
    if(!success) {
      console.error(`Deleted pipeline ${id} but was not able to publish success. Error handling not implemented!`)
    }
    return Promise.resolve()
  }

  async deleteAll(): Promise<void> {
    const deletedConfigs = await this.pipelineConfigRepository.deleteAll()
    for(const deletedConfig of deletedConfigs) {
      const success = this.configWritesPublisher.publishDeletion(deletedConfig.id, deletedConfig.metadata.displayName)
      if(!success) {
        console.error(`Deleted pipeline ${deletedConfig.id} but was not able to publish success. Error handling not implemented!`)
      }
    }
    return Promise.resolve()
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
