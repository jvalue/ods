const { connect } = require('@jvalue/node-dry-amqp/dist/amqpConnector')

const { AMQP_URL, AMQP_EXCHANGE } = require('./env')

async function publishEvent (topic, content, retries = 10, retryDelayMs = 2000) {
  const connection = await connect(AMQP_URL, retries, retryDelayMs)
  const channel = await connection.createChannel()
  const result = channel.publish(AMQP_EXCHANGE, topic, Buffer.from(JSON.stringify(content)))
  await channel.close()
  await connection.close()
  return result
}

module.exports = {
  publishEvent
}
