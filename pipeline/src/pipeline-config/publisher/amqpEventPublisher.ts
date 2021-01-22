import { AmqpPublisher } from '@jvalue/node-dry-amqp'

import {
  AMQP_URL,
  AMQP_EXCHANGE,
  AMQP_PIPELINE_EXECUTION_ERROR_TOPIC,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC,
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC,
  AMQP_PIPELINE_CONFIG_UPDATED_TOPIC,
  AMQP_PIPELINE_CONFIG_DELETED_TOPIC
} from '../../env'
import { EventPublisher } from './eventPublisher'

export class AmqpEventPublisher implements EventPublisher {
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

  publishError (pipelineId: number, pipelineName: string, errorMsg: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName,
      error: errorMsg
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_ERROR_TOPIC, content)
  }

  publishSuccess (pipelineId: number, pipelineName: string, result: unknown): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName,
      data: result
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, content)
  }
}
