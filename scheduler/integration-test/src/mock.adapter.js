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

function createMockAdapter () {
  const router = new Router()

  router.get('/datasources', async ctx => {
    ctx.type = 'application/json'
    ctx.body = initialSources
  })

  router.post('/datasources/:datasourceId/trigger', async ctx => {
    const id = Number(ctx.params.datasourceId)
    console.log(`Trigger pulled for datasource ${id}`)
    const calls = triggerRequests.get(id)
    if (calls === undefined) {
      triggerRequests.set(id, 1)
    } else {
      triggerRequests.set(id, triggerRequests.get(id) + 1)
    }
    ctx.status = 201
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
