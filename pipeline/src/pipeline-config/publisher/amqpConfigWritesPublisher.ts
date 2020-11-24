import { AmqpPublisher } from '@jvalue/node-dry-amqp'

import ConfigWritesPublisher from './configWritesPublisher'
import {
  AMQP_EXCHANGE,
  AMQP_URL,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_UPDATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '../../env'

export default class AmqpConfigWritesPublisher implements ConfigWritesPublisher {
  private readonly publisher: AmqpPublisher

  constructor () {
    this.publisher = new AmqpPublisher()
  }

  async init (retries: number, msBackoff: number): Promise<void> {
    const exchange = {
      name: AMQP_EXCHANGE,
      type: 'topic'
    }
    const exchangeConfig = {}
    return await this.publisher.init(AMQP_URL, retries, msBackoff, exchange, exchangeConfig)
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
