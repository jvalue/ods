import amqp from 'amqplib'

const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || 'ods_global'
const AMQP_PIPELINE_CONFIG_CREATION_TOPIC = process.env.AMQP_PIPELINE_CONFIG_CREATION_TOPIC || 'pipeline.config.created'
const AMQP_PIPELINE_CONFIG_DELETION_TOPIC = process.env.AMQP_PIPELINE_CONFIG_DELETION_TOPIC || 'pipeline.config.deleted'
const AMQP_URL = process.env.AMQP_URL!

let channel: amqp.Channel
let initialized = false

export async function init(retries: number, backoff: number): Promise<void> {
  if (!initialized) {
    for (let i = 0; i <= retries; i++) {
      try {
        const connection = await connect()
        channel = await initChannel(connection)
        initialized = true
        return
      } catch (error) {
        console.error(`Error initializing the AMQP Client (${i}/${retries}):
        ${error}. Retrying in ${backoff}...`)
        await sleep(backoff)
      }
    }
    Promise.reject(`Could not connect to AMQP broker at ${AMQP_URL}`)
  } else {
    console.log('AmqpClient initialization aborted: Already initialized.')
    return
  }
}

async function connect(): Promise<amqp.Connection> {
  try {
    const connection = await amqp.connect(AMQP_URL)
    console.log(`Connection to amqp host at ${AMQP_URL} successful`)
    return connection
  } catch (error) {
    console.error(`Error connecting to amqp host at ${AMQP_URL}: ${error}`)
    throw error
  }
}

async function initChannel(connection: amqp.Connection): Promise<amqp.Channel> {
  try {
    const channel = await connection.createChannel()
    await channel.assertExchange(AMQP_EXCHANGE, 'topic', {durable: false})
    console.log(`Exchange ${AMQP_EXCHANGE} successfully initialized.`)
    return channel
  } catch (error) {
    console.error(`Error creating exchange ${AMQP_EXCHANGE}: ${error}`)
    throw error
  }
}

export function publishPipelineCreation(content: PipelineConfigCreationEvent): boolean {
  if (!initialized || !channel) {
    console.error('Publish not possible, AMQP client not initialized.')
    return false
  } else {
    try {
      const success = channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATION_TOPIC, Buffer.from(JSON.stringify(content)))
      console.log(`Sent: ${JSON.stringify(content)} to topic ${AMQP_PIPELINE_CONFIG_CREATION_TOPIC} in exchange ${AMQP_EXCHANGE}`)
      return success
    } catch (error) {
      console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMQP_PIPELINE_CONFIG_CREATION_TOPIC}: ${error}`)
      return false
    }
  }
}

export function publishPipelineDeletion(content: PipelineConfigDeletionEvent): boolean {
  if (!initialized || !channel) {
    console.error('Publish not possible, AMQP client not initialized.')
    return false
  } else {
    try {
      const success = channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_DELETION_TOPIC, Buffer.from(JSON.stringify(content)))
      console.log(`Sent: ${JSON.stringify(content)} to topic ${AMQP_PIPELINE_CONFIG_DELETION_TOPIC} in exchange ${AMQP_EXCHANGE}`)
      return success
    } catch (error) {
      console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMQP_PIPELINE_CONFIG_DELETION_TOPIC}: ${error}`)
      return false
    }
  }
}

function sleep(backoff: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, backoff))
}

export interface PipelineExecutionSuccessEvent {
  pipelineId: number;
  pipelineName: string;

  data?: object;
}

export interface PipelineExecutionErrorEvent {
  pipelineId: number;
  pipelineName: string;

  error: object;
}

export interface PipelineConfigCreationEvent {
  pipelineId: number;
}

export interface PipelineConfigDeletionEvent {
  pipelineId: number;
}
