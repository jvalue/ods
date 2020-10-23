import * as AMQP from 'amqplib'

import { sleep } from '../sleep'
import { stringify } from '../logging'

export default class AmqpConsumer {
  private connection?: AMQP.Connection

  public async init (amqpUrl: string, retries: number, msBackoff: number): Promise<void> {
    for (let i = 1; i <= retries; i++) {
      try {
        this.connection = await this.connect(amqpUrl)
        return
      } catch (error) {
        if (i >= retries) {
          console.error(`Could not establish connection to AMQP Broker (${amqpUrl})`)
          throw error
        }
        console.error(`Error connecting to AMQP (${i}/${retries})`)
      }
      await sleep(msBackoff)
    }
  }

  private async connect (amqpUrl: string): Promise<AMQP.Connection> {
    const connection = await AMQP.connect(amqpUrl)
    console.log(`Connection to amqp host at ${amqpUrl} successful`)
    return connection
  }

  private async initChannel (connection: AMQP.Connection, exchange: string): Promise<AMQP.Channel> {
    try {
      const channel = await connection.createChannel()
      await channel.assertExchange(exchange, 'topic', {
        durable: true
      })
      console.log(`Exchange ${exchange} successfully initialized.`)
      return channel
    } catch (error) {
      throw new Error(`Error creating exchange ${exchange}: ${error}`)
    }
  }

  public async consume (
    exchange: string,
    topic: string,
    queueName: string,
    consumeEvent: (msg: AMQP.ConsumeMessage | null) => Promise<void>
  ): Promise<void> {
    if (this.connection === undefined) {
      throw new Error('Consume not possible, AMQP client not initialized.')
    }

    try {
      const channel = await this.initChannel(this.connection, exchange)
      const q = await channel.assertQueue(queueName, {
        exclusive: false
      })
      await channel.bindQueue(q.queue, exchange, topic)
      await channel.consume(q.queue, msg => {
        console.debug("[EventConsume] %s:'%s'", msg?.fields.routingKey, stringify(msg?.content.toString()))
        consumeEvent(msg)
          .catch(error => console.error(`Failed to handle ${msg?.fields.routingKey ?? 'null'} event`, error))
      })
    } catch (error) {
      throw new Error(`Error subscribing to exchange ${exchange} under key ${topic}: ${error}`)
    }
  }
}
