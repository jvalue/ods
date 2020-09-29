const amqp = require('amqplib')
let amqpConnection

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function connectAmqp (url) {
  amqpConnection = await amqp.connect(url)
}

async function receiveAmqp (url, exchange, topic, queue, publishedEvents) {
  const channel = await amqpConnection.createChannel()
  await channel.assertExchange(exchange, 'topic')
  const q = await channel.assertQueue(queue)
  await channel.bindQueue(q.queue, exchange, topic)

  await channel.consume(q.queue, async (msg) => {
    const event = JSON.parse(msg.content.toString())
    const routingKey = msg.fields.routingKey
    if (!publishedEvents.get(routingKey)) {
      publishedEvents.set(routingKey, [])
    }
    publishedEvents.get(routingKey).push(event)
  })
}

async function closeAmqp () {
  if (amqpConnection) {
    await amqpConnection.close()
  }
}

module.exports = {
  sleep,
  connectAmqp,
  receiveAmqp,
  closeAmqp
}
