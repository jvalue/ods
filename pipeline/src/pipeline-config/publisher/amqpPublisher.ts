import { sleep, stringifiers } from '@jvalue/node-dry-basics'
import * as AMQP from 'amqplib'

export default class AmqpPublisher {
  private channel?: AMQP.Channel

  public async init (amqpUrl: string, exchange: string, retries: number, msBackoff: number): Promise<void> {
    for (let i = 0; i <= retries; i++) {
      try {
        const connection = await this.connect(amqpUrl)
        this.channel = await this.initChannel(connection, exchange)
        return
      } catch (error) {
        console.error(`Error initializing the AMQP Client (${i}/${retries}):
        ${error}. Retrying in ${msBackoff}...`)
        await sleep(msBackoff)
      }
    }
    throw new Error(`Could not connect to AMQP broker at ${amqpUrl}`)
  }

  private async connect (amqpUrl: string): Promise<AMQP.Connection> {
    try {
      const connection = await AMQP.connect(amqpUrl)
      console.log(`Connection to amqp host at ${amqpUrl} successful`)
      return connection
    } catch (error) {
      console.error(`Error connecting to amqp host at ${amqpUrl}: ${error}`)
      throw error
    }
  }

  private async initChannel (connection: AMQP.Connection, exchange: string): Promise<AMQP.Channel> {
    try {
      const channel = await connection.createChannel()
      await channel.assertExchange(exchange, 'topic')
      console.log(`Exchange ${exchange} successfully initialized.`)
      return channel
    } catch (error) {
      console.error(`Error creating exchange ${exchange}: ${error}`)
      throw error
    }
  }

  public publish (exchange: string, topic: string, content: object): boolean {
    if (this.channel === undefined) {
      console.error('Publish not possible, AMQP client not initialized.')
      return false
    } else {
      try {
        const success = this.channel.publish(exchange, topic, Buffer.from(JSON.stringify(content)))
        console.debug(`[EventProduce] ${topic}: ${stringifiers.stringify(content)}`)
        return success
      } catch (error) {
        console.error(`Error publishing to exchange ${exchange} under key ${topic}: ${error}`)
        return false
      }
    }
  }
}
