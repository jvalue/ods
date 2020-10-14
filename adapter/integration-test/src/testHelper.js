const amqp = require('amqplib')

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function connectAmqp (url) {
  return await amqp.connect(url)
}

async function consumeAmqpMsg (connection, exchange, topic, queue, publishedEvents) {
  const channel = await connection.createChannel()
  await channel.assertExchange(exchange, 'topic')
  const q = await channel.assertQueue(queue)
  await channel.bindQueue(q.queue, exchange, topic)

  await channel.consume(q.queue, msg => {
    const event = JSON.parse(msg.content.toString())
    const routingKey = msg.fields.routingKey
    if (!publishedEvents.get(routingKey)) {
      publishedEvents.set(routingKey, [])
    }
    publishedEvents.get(routingKey).push(event)
  })
}

module.exports = {
  sleep,
  connectAmqp,
  consumeAmqpMsg
}
