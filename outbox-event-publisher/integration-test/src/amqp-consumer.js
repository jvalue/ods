const AMQP = require('amqplib')
const { sleep } = require('@jvalue/node-dry-basics')

const { AMQP_URL, AMQP_EXCHANGE, AMQP_QUEUE, AMQP_QUEUE_ROUTING_KEY, AMQP_CONNECTION_RETRIES, AMQP_CONNECTION_BACKOFF } = require('./env')

class AmqpConsumer {
  async init(msgHandler) {
    let lastError = undefined;
    for (let i = 0; i < AMQP_CONNECTION_RETRIES; i++) {
      try {
        this.connection = await AMQP.connect(AMQP_URL)
      } catch (error) {
        lastError = error
        await sleep(AMQP_CONNECTION_BACKOFF)
      }
    }
    if (!this.connection) {
      throw lastError
    }

    this.channel = await this.connection.createChannel()
    await this.channel.assertExchange(AMQP_EXCHANGE, 'topic')

    await this.channel.assertQueue(AMQP_QUEUE, { exclusive: false })
    await this.channel.bindQueue(AMQP_QUEUE, AMQP_EXCHANGE, AMQP_QUEUE_ROUTING_KEY)

    const consumeResponse = await this.channel.consume(AMQP_QUEUE, msg => {
      if (msg === null) {
        return
      }
      msgHandler(msg)
    })
    this.consumerTag = consumeResponse.consumerTag;
  }

  async stop() {
    if (this.consumerTag) {
      await this.channel.cancel(this.consumerTag)
      this.consumerTag = undefined
    }

    if (this.channel) {
      await this.channel.close()
      this.channel = undefined
    }

    if (this.connection) {
      await this.connection.close()
      this.connection = undefined
    }
  }
}

module.exports = {
  AmqpConsumer
}
