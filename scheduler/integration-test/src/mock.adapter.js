const Koa = require('koa')
const Router = require('koa-router')

const { MOCK_SERVER_PORT } = require('./env')
const { jsonDateAfter } = require('./testHelper')

const triggerRequests = new Map()
const initialSources = [
  {
    id: 101,
    trigger: {
      firstExecution: jsonDateAfter(1000),
      periodic: true,
      interval: 1000
    }
  }
]

async function createMockAdapter (amqpConnection, exchange, queue, topic) {
  const router = new Router()

  router.get('/datasources', async ctx => {
    ctx.type = 'application/json'
    ctx.body = initialSources
  })

  /* Init AMQP datasource.import-trigger consumption */
  const channel = await amqpConnection.createChannel()
  await channel.assertExchange(exchange, 'topic')

  await channel.assertQueue(queue)
  await channel.bindQueue(queue, exchange, topic)

  await channel.consume(queue, msg => {
    const event = JSON.parse(msg.content.toString())
    const routingKey = msg.fields.routingKey
    console.log(`Event received on topic "${routingKey}": ${JSON.stringify(event)}`)
    const id = Number(event.datasourceId)
    if (id) {
      const calls = triggerRequests.get(id)
      if (calls === undefined) {
        triggerRequests.set(id, 1)
      } else {
        triggerRequests.set(id, triggerRequests.get(id) + 1)
      }
    } else {
      console.log('Failed to extract datasourceId from event!')
    }
  })

  const app = new Koa()
  app.use(router.routes())
  return app.listen(MOCK_SERVER_PORT, () => console.log('Starting mock adapter server on port ' + MOCK_SERVER_PORT))
}

function getTriggeredRequests (id) {
  return triggerRequests.get(id) ?? 0
}

module.exports = {
  createMockAdapter,
  getTriggeredRequests
}
