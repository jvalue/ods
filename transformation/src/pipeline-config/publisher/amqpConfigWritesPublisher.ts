import { ConfigWritesPublisher } from "./configWritesPublisher";
import AmqpPublisher from "./amqpPublisher";

const AMQP_URL = process.env.AMQP_URL!
const AMQP_EXCHANGE = process.env.AMQP_PIPELINE_EXECUTION_EXCHANGE!
const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_CREATED_TOPIC!
const AMQP_PIPELINE_CONFIG_UPDATED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_UPDATED_TOPIC!
const AMQP_PIPELINE_CONFIG_DELETED_TOPIC = process.env.AMQP_PIPELINE_CONFIG_DELETED_TOPIC!


export default class AmqpConfigWritesPublisher implements ConfigWritesPublisher {

  private publisher: AmqpPublisher

  constructor() {
    this.publisher = new AmqpPublisher()
  }

  init(retries: number, msBackoff: number) {
    return this.publisher.init(AMQP_URL, AMQP_EXCHANGE, retries, msBackoff)
  }

  publishCreation(pipelineId: number, pipelineName: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, content)
  }

  publishUpdate(pipelineId: number, pipelineName: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_UPDATED_TOPIC, content)
  }

  publishDeletion(pipelineId: number, pipelineName: string): boolean {
    const content = {
      pipelineId: pipelineId,
      pipelineName: pipelineName
    }
    return this.publisher.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_DELETED_TOPIC, content)
  }
}
