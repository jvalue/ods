import * as AMQP from 'amqplib'

export default class AmqpConsumer {
  private connection?: AMQP.Connection

  public async init (amqpUrl: string, retries: number, msBackoff: number): Promise<void> {
    for (let i = 0; i <= retries; i++) {
      try {
        this.connection = await this.connect(amqpUrl)
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
      return Promise.reject(new Error(`Error connecting to amqp host at ${amqpUrl}: ${error}`))
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
      return Promise.reject(new Error(`Error creating exchange ${exchange}: ${error}`))
    }
  }

  private sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  public async consume (
    exchange: string,
    topic: string,
    queueName: string,
    consumeEvent: (msg: AMQP.ConsumeMessage | null) => void
  ): Promise<void> {
    if (!this.connection) {
      return Promise.reject(new Error('Consume not possible, AMQP client not initialized.'))
    }

    try {
      const channel = await this.initChannel(this.connection, exchange)
      const q = await channel.assertQueue(queueName, {
        exclusive: false
      })
      await channel.bindQueue(q.queue, exchange, topic)
      await channel.consume(q.queue, consumeEvent)
    } catch (error) {
      return Promise.reject(new Error(`Error subscribing to exchange ${exchange} under key ${topic}: ${error}`))
    }
  }
}
