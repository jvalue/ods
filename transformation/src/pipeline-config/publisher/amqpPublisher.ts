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
        await this.sleep(msBackoff)
      }
    }
    return Promise.reject(new Error(`Could not connect to AMQP broker at ${amqpUrl}`))
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

  private initChannel = async (connection: AMQP.Connection, exchange: string): Promise<AMQP.Channel> => {
    try {
      const channel = await connection.createChannel()
      await channel.assertExchange(exchange, 'topic', {
        durable: false
      })
      console.log(`Exchange ${exchange} successfully initialized.`)
      return channel
    } catch (error) {
      console.error(`Error creating exchange ${exchange}: ${error}`)
      throw error
    }
  }

  private sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public publish (exchange: string, topic: string, content: object): boolean {
    if (!this.channel) {
      console.error('Publish not possible, AMQP client not initialized.')
      return false
    } else {
      try {
        const success = this.channel.publish(exchange, topic, Buffer.from(JSON.stringify(content)))
        console.log(`Sent: ${JSON.stringify(content)} to topic ${topic} in exchange ${exchange}`)
        return success
      } catch (error) {
        console.error(`Error publishing to exchange ${exchange} under key ${topic}: ${error}`)
        return false
      }
    }
  }
}
