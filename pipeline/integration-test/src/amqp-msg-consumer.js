async function consumeTopics (amqpConnection, exchange, queue, topics) {
  const publishedEvents = new Map() // routing key -> received msgs []

  const channel = await amqpConnection.createChannel()
  await channel.assertExchange(exchange, 'topic')

  await channel.assertQueue(queue)
  for (const topic of topics) {
    await channel.bindQueue(queue, exchange, topic)
  }

  await channel.consume(queue, msg => {
    const event = JSON.parse(msg.content.toString())
    const routingKey = msg.fields.routingKey
    console.log(`Event received on topic "${routingKey}": ${JSON.stringify(event)}`)
    if (!publishedEvents.get(routingKey)) {
      publishedEvents.set(routingKey, [])
    }
    publishedEvents.get(routingKey).push(event)
  })

  return (topic) => publishedEvents.get(topic)
}

module.exports = {
  consumeTopics
}
