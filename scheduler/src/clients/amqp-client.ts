import amqp from 'amqplib'

const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || 'ods_global'
const AMPQ_NOTIFICATION_EXECUTION_TOPIC = process.env.AMQP_NOTIFICATION_EXECUTION_TOPIC || 'notification.execution.*'
const AMQP_URL = process.env.AMQP_URL!


let channel: amqp.Channel
let initialized = false

export async function init(): Promise<void> {
  if (!initialized) {
    try {
      const connection = await connect()
      channel = await initChannel(connection)
      initialized = true
    } catch (error) {
      console.error(`Error initializing the AMQP Client: ${error}`)
    }
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
    await channel.assertExchange(AMQP_EXCHANGE, 'topic', {durable: true})
    console.log(`Exchange ${AMQP_EXCHANGE} successfully initialized.`)
    return channel
  } catch (error) {
    console.error(`Error creating exchange ${AMQP_EXCHANGE}: ${error}`)
    throw error
  }
}

export function publish(content: NotificationTriggerEvent): boolean {
  if (!initialized || !channel) {
    console.error('Publish not possible, AMQP client not initialized.')
    return false
  } else {
    try {
      return channel.publish(AMQP_EXCHANGE, AMPQ_NOTIFICATION_EXECUTION_TOPIC, Buffer.from(content))
    } catch (error) {
      console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMPQ_NOTIFICATION_EXECUTION_TOPIC}: ${error}`)
      return false
    }
  }
}

export interface NotificationTriggerEvent {
  pipelineId: number;
  pipelineName: string;

  dataLocation: string; // url (location) of the queryable data

  data?: object;
  error?: object;
}
