import ConfigWritesPublisher from './configWritesPublisher'
import AmqpPublisher from './amqpPublisher'
import {
  AMQP_EXCHANGE,
  AMQP_URL,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_UPDATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '../../env'
import { PipelineConfigDTO } from '@/pipeline-config/model/pipelineConfig'

export default class AmqpConfigWritesPublisher implements ConfigWritesPublisher {
  private publisher: AmqpPublisher

  constructor () {
    this.publisher = new AmqpPublisher()
  }

  init (retries: number, msBackoff: number): Promise<void> {
    return this.publisher.init(AMQP_URL, AMQP_EXCHANGE, retries, msBackoff)
  }

  publishCreation (pipelineId: number, config: PipelineConfigDTO): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: config.metadata.displayName,
      defaultAPI: config.defaultAPI
    }
    this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_UPDATED_TOPIC, content)
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, content)
  }

  publishUpdate (pipelineId: number, config: PipelineConfigDTO): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: config.metadata.displayName,
      defaultAPI: config.defaultAPI
    }
    console.log('********** PUBLISH EVENT')
    this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_UPDATED_TOPIC, content)
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_UPDATED_TOPIC, content)
  }

  publishDeletion (pipelineId: number, pipelineName: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_DELETED_TOPIC, content)
  }
}
