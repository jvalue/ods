import amqp from 'amqplib'

const AMQP_HOST = process.env.AMQP_HOST
const AMQP_USR = process.env.AMQP_USR
const AMQP_PWD = process.env.AMQP_PWD
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE || 'ods'
const AMQP_KEY_SCHED = process.env.AMQP_KEY_SCHED || 'scheduler'
const AMQP_URL = `amqp://${AMQP_USR}:${AMQP_PWD}@${AMQP_HOST}`

export class AmqpClient {
  private channel: amqp.Channel | undefined

  constructor () {
    this.init()
  }

  private async init (): Promise<void> {
    try {
      const connection = await this.connect()
      this.channel = await this.initChannel(connection)
    } catch (error) {
      console.error(`Error initializing the AMQP Client: ${error}`)
    }
  }

  private async connect (): Promise<amqp.Connection> {
    try {
      const connection = await amqp.connect(AMQP_URL)
      console.log(`Connection to amqp host at ${AMQP_HOST} successful`)
      return connection
    } catch (error) {
      console.error(`Error connecting to amqp host at ${AMQP_HOST}: ${error}`)
      throw error
    }
  }

  private async initChannel (connection: amqp.Connection): Promise<amqp.Channel> {
    try {
      const channel = await connection.createChannel()
      await channel.assertExchange(AMQP_EXCHANGE, 'topic', { durable: true })
      console.log(`Exchange ${AMQP_EXCHANGE} successfully initialized.`)
      return channel
    } catch (error) {
      console.error(`Error creating exchange ${AMQP_EXCHANGE}: ${error}`)
      throw error
    }
  }

  public publish (content: NotificationTriggerEvent): boolean {
    if (!this.channel) {
      console.error('Publish not possible, AMQP client not initialized.')
      return false
    } else {
      try {
        return this.channel.publish(AMQP_EXCHANGE, AMQP_KEY_SCHED, Buffer.from(content))
      } catch (error) {
        console.error(`Error publishing to exchange ${AMQP_EXCHANGE} under key ${AMQP_KEY_SCHED}: ${error}`)
        return false
      }
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
