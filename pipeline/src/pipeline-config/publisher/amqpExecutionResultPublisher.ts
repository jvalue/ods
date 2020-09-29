import {
  AMQP_URL,
  AMQP_EXCHANGE,
  AMQP_PIPELINE_EXECUTION_ERROR_TOPIC,
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
} from '../../env'
import AmqpPublisher from './amqpPublisher'
import { ExecutionResultPublisher } from './executionResultPublisher'

export default class AmqpExecutionResultPublisher implements ExecutionResultPublisher {
  private publisher: AmqpPublisher

  constructor () {
    this.publisher = new AmqpPublisher()
  }

  init (retries: number, msBackoff: number): Promise<void> {
    return this.publisher.init(AMQP_URL, AMQP_EXCHANGE, retries, msBackoff)
  }

  publishError (pipelineId: number, pipelineName: string, errorMsg: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName,
      error: errorMsg
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_ERROR_TOPIC, content)
  }

  publishSuccess (pipelineId: number, pipelineName: string, result: object): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName,
      data: result
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, content)
  }
}
