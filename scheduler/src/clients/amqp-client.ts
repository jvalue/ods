import amqp from 'amqplib'

const AMQP_HOST = process.env.AMQP_HOST
const AMQP_USR = process.env.AMQP_USR
const AMQP_PWD = process.env.AMQP_PWD
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || 'ods_global'
const AMQP_KEY_SCHED = process.env.AMQP_KEY_SCHED || 'scheduler'
const AMQP_URL = `amqp://${AMQP_USR}:${AMQP_PWD}@${AMQP_HOST}`


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
    console.log(`Connection to amqp host at ${AMQP_HOST} successful`)
    return connection
  } catch (error) {
    console.error(`Error connecting to amqp host at ${AMQP_HOST}: ${error}`)
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
      return channel.publish(AMQP_EXCHANGE, AMQP_KEY_SCHED, Buffer.from(content))
    } catch (error) {
      console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMQP_KEY_SCHED}: ${error}`)
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
