import * as AMQP from "amqplib"

import { ExecutionResultPublisher } from "./executionResultPublisher";

const AMQP_URL = process.env.AMQP_URL!
const AMQP_EXCHANGE = process.env.AMQP_PIPELINE_EXECUTION_EXCHANGE!
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC!
const AMQP_PIPELINE_EXECUTION_ERROR_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_ERROR_TOPIC!


export default class AmqpExecutionResultPublisher implements ExecutionResultPublisher {
  private channel?: AMQP.Channel


  async init(retries: number, msBackoff: number): Promise<void> {
    for (let i = 0; i <= retries; i++) {
      try {
        const connection = await this.connect()
        this.channel = await this.initChannel(connection)
        return
      } catch (error) {
        console.error(`Error initializing the AMQP Client (${i}/${retries}):
        ${error}. Retrying in ${msBackoff}...`)
        await this.sleep(msBackoff)
      }
    }
    Promise.reject(`Could not connect to AMQP broker at ${AMQP_URL}`)
  }

  private async connect(): Promise<AMQP.Connection> {
    try {
      const connection = await AMQP.connect(AMQP_URL)
      console.log(`Connection to amqp host at ${AMQP_URL} successful`)
      return connection
    } catch (error) {
      console.error(`Error connecting to amqp host at ${AMQP_URL}: ${error}`)
      throw error
    }
  }

  private initChannel = async (connection: AMQP.Connection): Promise<AMQP.Channel> => {
    try {
      const channel = await connection.createChannel()
      channel.assertExchange(AMQP_EXCHANGE, 'topic', {
          durable: false
      });
      console.log(`Exchange ${AMQP_EXCHANGE} successfully initialized.`)
      return channel
    } catch (error) {
      console.error(`Error creating exchange ${AMQP_EXCHANGE}: ${error}`)
      throw error
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }


  publishError(pipelineId: number, pipelineName: string, errorMsg: string): boolean {
    if (!this.channel) {
      console.error('Publish not possible, AMQP client not initialized.')
      return false
    } else {
      try {
        const content = {
          pipelineId: pipelineId,
          pipelineName: pipelineName,
          error: errorMsg
        }
        const success = this.channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_ERROR_TOPIC, Buffer.from(JSON.stringify(content)))
        console.log(`Sent: ${JSON.stringify(content)} to topic ${AMQP_PIPELINE_EXECUTION_ERROR_TOPIC} in exchange ${AMQP_EXCHANGE}`)
        return success
      } catch (error) {
        console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMQP_PIPELINE_EXECUTION_ERROR_TOPIC}: ${error}`)
        return false
      }
    }
  }

  publishSuccess(pipelineId: number, pipelineName: string, result: object): boolean {
    if (!this.channel) {
      console.error('Publish not possible, AMQP client not initialized.')
      return false
    } else {
      try {
        const content = {
          pipelineId: pipelineId,
          pipelineName: pipelineName,
          data: result
        }
        const success = this.channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, Buffer.from(JSON.stringify(content)))
        console.log(`Sent: ${JSON.stringify(content)} to topic ${AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC} in exchange ${AMQP_EXCHANGE}`)
        return success
      } catch (error) {
        console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC}: ${error}`)
        return false
      }
    }
  }

}
