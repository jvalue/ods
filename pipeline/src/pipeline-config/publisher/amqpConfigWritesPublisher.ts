import {
  AMQP_EXCHANGE,
  AMQP_URL,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_UPDATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '@ods/env'

import ConfigWritesPublisher from './configWritesPublisher'
import AmqpPublisher from './amqpPublisher'

export default class AmqpConfigWritesPublisher implements ConfigWritesPublisher {
  private readonly publisher: AmqpPublisher

  constructor () {
    this.publisher = new AmqpPublisher()
  }

  async init (retries: number, msBackoff: number): Promise<void> {
    return await this.publisher.init(AMQP_URL, AMQP_EXCHANGE, retries, msBackoff)
  }

  publishCreation (pipelineId: number, pipelineName: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, content)
  }

  publishUpdate (pipelineId: number, pipelineName: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName
    }
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
