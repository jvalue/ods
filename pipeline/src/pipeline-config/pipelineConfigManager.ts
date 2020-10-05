import PipelineExecutor from '../pipeline-execution/pipelineExecutor'
import { ExecutionResultPublisher } from './publisher/executionResultPublisher'
import PipelineConfigRepository from './pipelineConfigRepository'
import { PipelineConfig, PipelineConfigDTO } from './model/pipelineConfig'
import ConfigWritesPublisher from './publisher/configWritesPublisher'

export class PipelineConfigManager {
  constructor (
    private readonly pipelineConfigRepository: PipelineConfigRepository,
    private readonly pipelineExecutor: PipelineExecutor,
    private readonly configWritesPublisher: ConfigWritesPublisher,
    private readonly executionResultPublisher: ExecutionResultPublisher
  ) {}

  async create (config: PipelineConfigDTO): Promise<PipelineConfig> {
    const savedConfig = await this.pipelineConfigRepository.create(config)
    const success = this.configWritesPublisher.publishCreation(savedConfig.id, savedConfig.metadata.displayName)
    if (!success) {
      console.error(
        `Saved pipeline ${savedConfig.id} but was not able to publish success.
        Error handling not implemented!`
      )
    }
    return savedConfig
  }

  async get (id: number): Promise<PipelineConfig | undefined> {
    return await this.pipelineConfigRepository.get(id)
  }

  async getAll (): Promise<PipelineConfig[]> {
    return await this.pipelineConfigRepository.getAll()
  }

  async getByDatasourceId (datasourceId: number): Promise<PipelineConfig[]> {
    return await this.pipelineConfigRepository.getByDatasourceId(datasourceId)
  }

  async update (id: number, config: PipelineConfigDTO): Promise<void> {
    await this.pipelineConfigRepository.update(id, config)
    const success = this.configWritesPublisher.publishUpdate(id, config.metadata.displayName)
    if (!success) {
      console.error(`Updated pipeline ${id} but was not able to publish success. Error handling not implemented!`)
    }
  }

  async delete (id: number): Promise<void> {
    const deletedPipeline = await this.pipelineConfigRepository.delete(id)
    const success = this.configWritesPublisher.publishDeletion(id, deletedPipeline.metadata.displayName)
    if (!success) {
      console.error(`Deleted pipeline ${id} but was not able to publish success. Error handling not implemented!`)
    }
  }

  async deleteAll (): Promise<void> {
    const deletedConfigs = await this.pipelineConfigRepository.deleteAll()
    for (const deletedConfig of deletedConfigs) {
      const success = this.configWritesPublisher.publishDeletion(deletedConfig.id, deletedConfig.metadata.displayName)
      if (!success) {
        console.error(
          `Deleted pipeline ${deletedConfig.id} but was not able to publish success.
          Error handling not implemented!`
        )
      }
    }
  }

  async triggerConfig (datasourceId: number, data: object): Promise<void> {
    const allConfigs = await this.getByDatasourceId(datasourceId)
    for (const config of allConfigs) {
      const result = this.pipelineExecutor.executeJob(config.transformation.func, data)
      if ('error' in result) {
        this.executionResultPublisher.publishError(config.id, config.metadata.displayName, result.error.message)
      } else if ('data' in result) {
        this.executionResultPublisher.publishSuccess(config.id, config.metadata.displayName, result.data)
      } else {
        console.error(`Pipeline ${config.id} executed with ambiguous result: no data and no error!`)
      }
    }
  }
}
